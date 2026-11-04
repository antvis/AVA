"""Prepare the requested Yuque update from the latest retrieved body."""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parent
doc=json.loads((R/'yuque-prepublish.json').read_text())
body=doc['body'];old_body=body
upload=json.loads((R/'asset-upload.json').read_text());item=upload['results'][0]
assert upload['success'] and item['spaceId']=='S_t5qynC'
url=item['asset']['assetUrl'];protocol=json.loads((R/'protocol.json').read_text())
assert all(c['status']=='completed' for c in protocol['conditions'])
question=protocol['user_prompt']
block=f'''<h3>Codex CLI 实测：只问一个业务问题</h3>

两组都只问：

> {question}

![GPT-6 Luna Low：无 AVA 与有 AVA 的真实 CLI 记录对照]({url})

同一 GPT-6 Luna、low 推理档、同一份 18,971 行合成 CSV、两个全新独立会话。图为真实 Codex CLI 记录复排的 Codex 风格对话界面，并非原始桌面截图；工具输出节选，最终回答完整保留。两组均未被要求追问口径或生成图表，本轮均未生成图表。

左侧未获得公司定义，自行选择客户销售的支付月份口径，回答增长 15.8%，并主动提醒其中包含未完成订单。右侧额外获得预先配置的财务语义，实际加载后按履约月、已履约范围和代销佣金计算，回答下降 13.9%。这展示的是已配置业务定义的复用；不能把差异全部归因为工具本身，也不能说 AVA 自动知道公司口径。

'''
anchor='核心价值 业务定义参与分析\n\n'
assert body.count(anchor)==1 and url not in body
body=body.replace(anchor,anchor+block,1)
old_intro='演示使用合成数据。关键结果已通过AVA参考查询与独立汇总交叉核验；Agent多轮彩排和产品界面集成尚待执行。'
new_intro='演示使用合成数据。关键结果已通过AVA参考查询与独立汇总交叉核验；场景二已完成Codex CLI单一问题对照，其余场景的Agent多轮彩排和产品界面集成尚待执行。'
body=body.replace(old_intro,new_intro,1)
marker='<h2 id="PF8Ff">WeaveFox Builder 有无 AVA 对照测试</h2>'
assert marker in body
method=f'''<h2 id="PF8Ff">Codex CLI 有无 AVA 对照实测</h2>

实测日期：2026年11月3日。本节替代之前尚未执行的WeaveFox Builder测试计划。目前完成的是场景二的一次配对示例，四个演示脚本仍保留，不代表四个场景均已跑完。

<h3>测试设置</h3>

- Codex CLI 0.165.0，模型gpt-6-luna，两组均为low推理档；AVA CLI 4.0.0-beta.5。
- 两组用户问题逐字相同：{question}
- 两组CSV文件字节一致。每组全新临时会话、独立工作目录，不提供参考答案或其他轮次的结果。
- 无AVA：只提供原始CSV，允许通用Python等工具，任务级禁用AVA及其Skill。
- 有AVA：同一CSV，额外提供公司已确认的semantic-finance.json，并启用本地AVA Skill与CLI；定义文件不含异常门店名称或分析结论。
- 用户问题与工作区运行说明都未要求特定答案、追问口径或生成图表。工作区说明只规定工具条件、文件范围、产物位置和运行权限。

本机仍安装AVA，这是任务级启用/禁用对照，不是卸载工具后的物理隔离。本轮展示的是“普通Agent自己选择口径”与“Agent通过AVA复用预配置公司口径”的工作流差异，其中包含业务上下文差异。

<h3>真实结果</h3>

| 条件 | 实际采用的口径 | 8月（元） | 9月（元） | 环比 |
| --- | --- | ---: | ---: | ---: |
| 无AVA | 外部客户销售，支付月，实付减退款，代销计全额，包含已支付未履约订单 | 6,740,687.05 | 7,803,998.06 | +15.77%（回答显示+15.8%） |
| 有AVA | 已履约外部客户销售，履约月，代销只计佣金，金额与退款分别逐行四舍五入到分 | 4,293,025.42 | 3,697,575.18 | -13.87%（回答显示-13.9%） |

无AVA组主动提醒：9月增长包含较多已支付但未完成的订单，并补充已完成订单净额的对照。这条提醒完整保留在截图里，不将左侧描述为毫无保留地报增长。

有AVA组定位到深圳南山店减少547,968.89元、广州天河店增加66,713.31元；家具减少691,945.63元、数码增加96,495.39元。不同维度是同一总变化的拆解，不能互相相加。

<h3>记录与核验</h3>

- 核验了两组相同的问题和CSV哈希，原始输入未改动。
- 核验了实际加载的语义与提供的定义一致，AVA月度结果与独立参考汇总一致；各完整互斥分组均勾稽到-595,450.24元。
- 检查了无AVA组全部终端命令，未调用AVA或读取AVA Skill。
- 保留完整事件日志、命令、标准输出和原始回答。工具视图节选成功步骤，日志中另保留AVA一次socket权限重试及一次SQL语法错误修正。两组本轮均未生成图表。
- 截图已检查1440、1100、760三种宽度，7个工具面板默认展开，无横向裁切；支持键盘展开/折叠。

本轮每组仅运行一次，不推导准确率、性能或稳定性结论。此前同口径的强模型对照两组都算对，不能据此宣称AVA必然比通用工具准确；此前带有澄清要求或图表要求的版本没有用作本图。本轮在用户确定轻量模型和单一业务问题后固定条件，未按结果改写模型回答。

界面排版使用[redesign-codex-ui Skill](https://github.com/opcspace/CodexUI/tree/main/skills/redesign-codex-ui)，仅生成只读记录复排，未修改已安装的Codex客户端。

本机证据目录：/Users/banxuan/Documents/AVA/outputs/codex-ava-luna-question-20261103。实验工作目录：/Users/banxuan/Documents/AVA-test-skill-workspace/codex-ava-luna-question-20261103。
'''
body=body[:body.index(marker)]+method
assert url in body and question in body
for heading in ['YLFPz','YCr4q','pHWta','yFT0p']:assert f'id="{heading}"' in body
# All original scenario script text remains; only the new insertion and status line are added.
for start,end in [('<h2 id="YLFPz">','<h2 id="YCr4q">'),('<h2 id="pHWta">','<h2 id="yFT0p">'),('<h2 id="yFT0p">','<h2 id="PF8Ff">')]:
 assert old_body[old_body.index(start):old_body.index(end)]==body[body.index(start):body.index(end)]
(R/'yuque-ready.ymd').write_text(body)
(R/'yuque-change.json').write_text(json.dumps({'doc_id':doc['id'],'before_body_sha256':hashlib.sha256(old_body.encode()).hexdigest(),'after_body_sha256':hashlib.sha256(body.encode()).hexdigest(),'asset_id':item['asset']['assetId'],'asset_url':url,'preserved_other_scenarios':True,'new_question':question},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'doc_id':doc['id'],'before_chars':len(old_body),'after_chars':len(body),'image':url,'other_scenarios_preserved':True},ensure_ascii=False))
