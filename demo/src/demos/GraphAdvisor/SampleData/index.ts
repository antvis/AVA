import { FlowGraphData } from './FlowGraph'
import { KnowledgeTreeData } from './KnowledgeTree'
import { SankeyGraphData } from './SankeyGraph'
import { SubgraphData } from './Subgraph'
import { EuroCreditData } from './table'

export const ExampleDataset = [
  {id: 'flowgraph', name: 'Flow Graph', data: FlowGraphData},
  {id: 'table', name: 'Euro Credit', data: EuroCreditData},
  {id: 'sankey', name: 'Sankey', data: SankeyGraphData},
  {id: 'tree', name: 'Knowledge Tree', data: KnowledgeTreeData},
  {id: 'subgraphs', name: 'Subgraphs', data: SubgraphData},
]
