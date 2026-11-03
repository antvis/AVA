"""Offline checks for discovery evidence and task scoring; no model calls."""
import importlib.util
import json
import os
import subprocess
import re
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('discovery', Path(__file__).with_name('skill-discovery.py'))
discovery = importlib.util.module_from_spec(spec)
spec.loader.exec_module(discovery)


class DiscoveryScoring(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.case = self.root/'csv'
        skill = self.case/'.agents/skills/ava/SKILL.md'
        skill.parent.mkdir(parents=True)
        self.body = '---\nname: ava\ndescription: Explore data.\n---\n\nArbitrary workflow instructions.\n'
        skill.write_text(self.body)
        (self.case/'result.json').write_text(json.dumps(discovery.EXPECTED['csv']))

    def trace(self, output, query_error=False, completed=True):
        events = [{'type':'item.completed','item':{'id':'read','command':'cat .agents/skills/ava/SKILL.md','aggregated_output':output,'exit_code':0}}]
        if query_error:
            events.append({'type':'item.completed','item':{'id':'query','command':'ava query ds_test --dsl @query.sql','aggregated_output':'Error: listen EPERM','exit_code':1}})
        events.append({'type':'turn.completed' if completed else 'turn.failed'})
        (self.root/'csv-events.jsonl').write_text(''.join(json.dumps(e)+'\n' for e in events))

    @unittest.skipUnless(Path('/bin/zsh').exists(), 'zsh is not installed')
    def test_login_shell_uses_fixture_cli_even_with_quoted_paths(self):
        project = self.root/"quoted' $name"
        work = discovery.prepare(project, 'negative', '/unused/node')
        env = dict(os.environ, ZDOTDIR=str(work/'.shell'))
        actual = subprocess.check_output(['/bin/zsh', '-lc', 'command -v ava'], env=env, text=True).strip()
        self.assertEqual(actual, str(work/'bin/ava'))

    def test_source_help_is_not_treated_as_a_session(self):
        call = {'args': ['source', '--help'], 'exitCode': 0, 'stdout': 'Load a source and return a dataset ID.'}
        (self.root/'csv-cli.jsonl').write_text(json.dumps(call)+'\n')
        with patch.object(discovery.subprocess, 'run') as execute:
            self.assertEqual(discovery.cleanup(self.root, 'csv', '/unused/node'), [])
            execute.assert_not_called()

    def test_prompts_do_not_name_the_skill(self):
        for prompt in discovery.CASES.values():
            self.assertIsNone(re.search(r'(?i)\bava\b|\$ava|SKILL\.md|\bskill\b', prompt))

    def test_catalog_or_filename_is_not_body_read(self):
        self.trace('.agents/skills/ava/SKILL.md\n')
        result = discovery.score(self.root, 'csv', 0)
        self.assertFalse(result['targetSkillRead'])
        self.assertTrue(result['taskCorrect'])

    def test_full_read_is_detected_without_specific_headings(self):
        self.trace(self.body)
        result = discovery.score(self.root, 'csv', 0)
        self.assertTrue(result['targetSkillRead'])
        self.assertTrue(result['selectionMatchesExpectation'])

    def test_correct_fallback_is_not_successful_cli_query(self):
        self.trace(self.body, query_error=True)
        result = discovery.score(self.root, 'csv', 0)
        self.assertTrue(result['taskCorrect'])
        self.assertFalse(result['avaQuerySucceeded'])
        self.assertEqual(len(result['cliFailures']), 1)

    def test_incomplete_run_has_no_selection_score(self):
        self.trace(self.body, completed=False)
        result = discovery.score(self.root, 'csv', 1)
        self.assertIsNone(result['selectionMatchesExpectation'])
        self.assertIsNotNone(result['infrastructureError'])

    def test_invalid_result_is_a_task_failure(self):
        self.trace(self.body)
        (self.case/'result.json').write_text('{broken')
        result = discovery.score(self.root, 'csv', 0)
        self.assertFalse(result['taskCorrect'])
        self.assertIsNotNone(result['resultError'])

    def test_malformed_trace_is_not_a_trigger_failure(self):
        (self.root/'csv-events.jsonl').write_text('not JSON\n')
        result = discovery.score(self.root, 'csv', 0)
        self.assertIn('infrastructureError', result)
        self.assertNotIn('selectionMatchesExpectation', result)


if __name__ == '__main__':
    unittest.main()
