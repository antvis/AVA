export const CLASS_PREFIX = '__AUTO_CHART__';

const HEADER_HEIGHT = 48;

const ADVISOR_STYLE = `
  .${CLASS_PREFIX}toolbar {
    position: absolute;
    top: 20px;
    right: 120px;
    z-index: 10;
    display: none;
    box-sizing: border-box;
  }
  .${CLASS_PREFIX}toolbar * {
    box-sizing: border-box;
  }
  .${CLASS_PREFIX}advice_container {
    width: 300px;
    display: none;
    background: #fff;
    position: absolute;
    top: 44px;
    left: -132px;
    border-radius: 8px;
  }
  .${CLASS_PREFIX}advice_content {
    width: 100%;
    height: 100%;
    padding: 0 16px;
    overflow: hidden;
    border-radius: 8px;
    box-shadow: 0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08), 0 9px 28px 8px rgba(0,0,0,.05)
  }
  .${CLASS_PREFIX}advice_content_arrow {
    position: absolute;
    display: block;
    width: 12px;
    height: 12px;
    background: 0 0;
    border-style: solid;
    border-width: 4.24264069px;
    top: -5px;
    border-color: #fff transparent transparent #fff;
    box-shadow: -2px -2px 5px rgba(0,0,0,.06);
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
  }
  .${CLASS_PREFIX}advice {
    height: 130px;
    font-size: 12px;
    color: #FFFFFF;
    display: flex;
    padding: 20px 0;
    cursor: pointer;
    border-bottom: 1px solid #D8D8D8;
  }
  .${CLASS_PREFIX}advice-thumbnail img {
    height: 100%;
    width: auto;
    margin: auto;
  }

  .${CLASS_PREFIX}advice-desc {
    flex: 1;
    flex-direction: column;
    margin-left: 16px;
  }

  .${CLASS_PREFIX}advice-desc img {
    height: 24px;
    width: 24px;
  }

  .${CLASS_PREFIX}advice-desc .advice-chart-name {
    color: black;
    font-size: 16px;
    font-weight: 500;
    line-height: 40px;
  }

  .${CLASS_PREFIX}advice-desc .advice-score-text {
    color: #585858;
    font-size: 14px;
  }

  .${CLASS_PREFIX}advice-desc .advice-score {
    color: #1878FB;
  }

  .${CLASS_PREFIX}advice-thumbnail {
    flex: none;
    display: flex;
    height: 84px;
    width: 112px;
    border: 1px solid #e2e2e2;
  }

  .${CLASS_PREFIX}advice>div:nth-child(3) {
    margin-left: 8px;
    flex-grow: 1;
  }
  .${CLASS_PREFIX}advice>div:nth-child(3) div {
    line-height: 23px;
    text-align: right;
  }
  .${CLASS_PREFIX}advice:last-child{
    border: none;
  }
  .${CLASS_PREFIX}config_btn {
    height: 32px;
    width: 32px;
    text-align: center;
    display: inline-block;
    cursor: pointer;
  }
  .${CLASS_PREFIX}config_btn img {
    pointer-events: none;
    height: 32px;
    width: 32px;
    vertical-align: top;
  }
  .${CLASS_PREFIX}dev_btn {
    display: none;
    position: absolute;
    top: 20px;
    right: 64px;
    user-select: none;
    cursor: pointer;
  }
  .${CLASS_PREFIX}dev_panel {
    border-radius: 5px;
    overflow: hidden;
    box-shadow: 10px 10px 20px rgba(0, 0, 0, 0.25);
    box-sizing: border-box;
    position: absolute;
    background: #fff;
    z-index: 1000;
    display: none;
  }
  .${CLASS_PREFIX}dev_panel header {
    box-sizing: border-box;
    height: ${HEADER_HEIGHT}px;
    width: 100%;
    padding-left: 16px;
    font-size: 20px;
    font-weight: 500;
    cursor: move; 
    position: relative;
    z-index: 1;
    border-bottom: 1px solid #d8d8d8;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .${CLASS_PREFIX}dev_panel_close {
    margin: 8px;
    cursor: pointer;
  }
  .${CLASS_PREFIX}dev_panel_content {
    width: 100%;
    height: calc(100% - ${HEADER_HEIGHT}px);
  }
  .${CLASS_PREFIX}dev_panel_content iframe {
    height: 100%;
    width: 100%;
    border: none;
  }
  .${CLASS_PREFIX}dev_panel_mask {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: -1;
  }
  .${CLASS_PREFIX}no_data_content, .${CLASS_PREFIX}mock_guide {
    color: #aaa;
    text-align: center;
    position: relative;
    top: 50%;
    transform: translateY(-50%);
  }
  .${CLASS_PREFIX}mock_guide_button {
    margin-top: 22px;
    border-radius: 3px;
    height: 30px;
    width: 116px;
    font-size: 14px;
    display: inline-block;
    line-height: 30px;
    background: #454859;
    color: #fff;
    cursor: pointer;
  }
  .${CLASS_PREFIX}kpi-panel {
    display: flex;
  }
  .${CLASS_PREFIX}kpi-panel .${CLASS_PREFIX}kpi-panel-card {
    border-left: 3px solid #94b2ca;
    padding-left: 8px;
    margin-right: 36px;
  }
  .${CLASS_PREFIX}kpi-panel .${CLASS_PREFIX}kpi-panel-card-name {
    font-size: 12px;
    margin-bottom: 8px;
    color: rgba(0,0,0,.65);
  }
  .${CLASS_PREFIX}kpi-panel .${CLASS_PREFIX}kpi-panel-card-value {
    font-size: 24px;
  }
  .${CLASS_PREFIX}-table {
    width: 100%;
    border-collapse: collapse;
  }
  .${CLASS_PREFIX}-table td, .${CLASS_PREFIX}-table th {
    border-bottom: 1px solid #d8d8d8;
    padding: 4px;
  }
  .${CLASS_PREFIX}-table thead tr th{
    text-align: left;
  }
`;

const style = document.createElement('style');
style.textContent = ADVISOR_STYLE;
document.head.prepend(style);
