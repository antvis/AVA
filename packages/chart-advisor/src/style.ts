export const CLASS_PREFIX = '__AUTO_CHART__';

const HEADER_HEIGHT = 32;

const ADVISOR_STYLE = `
  .${CLASS_PREFIX}toolbar {
    position: absolute;
    bottom: 0px;
    left: 0px;
    z-index: 10;
    display: none;
    box-sizing: border-box;
  }
  .${CLASS_PREFIX}toolbar * {
    box-sizing: border-box;
  }
  .${CLASS_PREFIX}advice_container {
    width: 290px;
    display: none;
    padding: 0 16px;
    background: #454857;
    position: absolute;
    bottom: 100%;
    left: 0;
    max-height: 195px;
    overflow: auto;
  }
  .${CLASS_PREFIX}advice {
    height: 65px;
    font-size: 12px;
    color: #FFFFFF;
    display: flex;
    padding: 9px 0;
    cursor: pointer;
    border-bottom: 1px solid #D8D8D8;
  }
  .${CLASS_PREFIX}advice img {
    height: 46px;
    width: 46px;
    background: #fff;
  }
  .${CLASS_PREFIX}advice * {
    pointer-events: none;
    line-height: 46px;
    font-size: 14px;
  }
  .${CLASS_PREFIX}advice>div:nth-child(1) {
    width: 46px;
  }
  .${CLASS_PREFIX}advice>div:nth-child(2) {
    width: 46px;
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
  .${CLASS_PREFIX}chart_type_btn {
    height: 24px;
    width: 24px;
    text-align: center;
    display: inline-block;
    padding: 6px;
    background: #454857;
    color: #fff;
    cursor: pointer;
  }
  .${CLASS_PREFIX}chart_type_btn img {
    pointer-events: none;
    height: 12px;
    width: 12px;
    vertical-align: top;
  }
  .${CLASS_PREFIX}dev_btn {
    height: 27px;
    line-height: 27px;
    background: #454857;
    padding: 0 7px;
    color: #fff;
    display: none;
    position: absolute;
    bottom: 0;
    right: 0;
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
    line-height: ${HEADER_HEIGHT}px;
    cursor: move; 
    color: #fff;
    position: relative;
    z-index: 1;
    background-color: #454857;
    box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.45);
  }
  .${CLASS_PREFIX}dev_panel_close {
    margin: 8px;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #fff;
    text-align: center;
    color: #454857;
    font-size: 14px;
    line-height: 14px;
    cursor: pointer;
    float: right;
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
  
`;

const style = document.createElement('style');
style.textContent = ADVISOR_STYLE;
document.head.prepend(style);
