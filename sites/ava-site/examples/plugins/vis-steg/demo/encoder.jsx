/* eslint react/prop-types: 0 */

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { Modal, Radio, InputNumber, Form, Layout, Card, Button, Spin, Tabs, Input, Upload, Image } from 'antd';
import { SettingOutlined, PictureFilled, DownloadOutlined } from '@ant-design/icons';
import { LSBSteg } from '@antv/vis-steg';

import './index.less';

const { TextArea } = Input;
const { TabPane } = Tabs;
const { Dragger } = Upload;
const { Content } = Layout;

const downloadFile = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute('href', url);
  downloadAnchorNode.setAttribute('download', fileName);
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

async function downloadPng(imgUrl, exportName = 'default') {
  const b64toBlob = await fetch(`${imgUrl}`).then((res) => res.blob());
  downloadFile(b64toBlob, `${exportName}.png`);
}

/**
 * merge the options and defaults
 * @param options
 * @param defaults
 */
function initOptions(options, defaults) {
  const def = { ...defaults };
  Object.entries(options || {}).forEach(([key, value]) => {
    if (value !== undefined) {
      def[key] = value;
    }
  });
  return def;
}

// Load a image in a promise
function loadImg(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (url === undefined) reject(new Error('Image is undefined'));
    else {
      img.addEventListener('load', () => {
        resolve(img);
      });
      img.addEventListener('error', () => {
        reject(new Error(`Failed to load image URL: ${url}`));
      });
      img.crossOrigin = 'anonymous';
      img.src = url;
    }
  });
}

async function encodeImg(imgUrl, secretInfo, stegOpts, stegMethod = 'lsb') {
  try {
    const opts = initOptions(stegOpts, { encMode: 'binary', QRSize: 200, mxMsgLen: 130 });
    const { encMode, QRSize, mxMsgLen } = opts;
    const img = await loadImg(imgUrl);
    const containerImgCanvas = document.createElement('canvas');
    const containerCanvascxt = containerImgCanvas.getContext('2d');
    containerImgCanvas.width = img.width;
    containerImgCanvas.height = img.height;
    containerCanvascxt.drawImage(img, 0, 0);
    const containerImgData = containerCanvascxt.getImageData(0, 0, img.width, img.height);
    const containerImgBitmap = Array.from(containerImgData.data);
    let encodedImgData = new ImageData(containerImgCanvas.width, containerImgCanvas.height);

    if (stegMethod === 'lsb') {
      const testLSBSteg = new LSBSteg();
      const encodedImgBitmap = Uint8ClampedArray.from(
        await testLSBSteg.writeLSB({
          imgBitmapData: containerImgBitmap,
          imgHeight: img.height,
          imgWidth: img.width,
          secretInfo,
          encMode,
          QRSize,
          mxMsgLen,
        })
      );
      encodedImgData = new ImageData(encodedImgBitmap, containerImgCanvas.width, containerImgCanvas.height);
    }
    if (encodedImgData.data.length > 0) {
      containerCanvascxt.putImageData(encodedImgData, 0, 0);
      const encImgURL = containerImgCanvas.toDataURL('image/png');
      return encImgURL;
    }
    return undefined;
  } catch (err) {
    return undefined;
  }
}

const ImagePreview = ({ image }) => {
  const [isError, setIsError] = useState(false);
  return (
    <>
      <Image
        width={'100%'}
        src={image}
        preview={false}
        fallback="data:image/png;base64,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"
        onError={() => setIsError(true)}
      />
      {!isError && <></>}
    </>
  );
};

const UploadImgModal = ({ reload, setUploadImg }) => {
  const [image, setImage] = useState();
  useEffect(() => {
    setUploadImg(image);
  }, [image]);

  useEffect(() => {
    setImage(undefined);
  }, [reload]);

  const uploadImage = (info) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => setImage(reader.result));
    reader.readAsDataURL(info.file.originFileObj);
  };

  const inputImage = (event) => {
    setImage(event.target.value);
  };

  return (
    <div className="modal">
      <Tabs
        defaultActiveKey="local"
        onChange={() => {
          setImage(undefined);
        }}
      >
        <TabPane tab="Native Upload" key="local">
          {image ? (
            <ImagePreview image={image}></ImagePreview>
          ) : (
            <div>
              <Dragger
                action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
                showUploadList={false}
                onChange={uploadImage}
                className={classNames('sourceContainer', 'localContainer')}
              >
                <p className={'localLogo'}>
                  <PictureFilled />
                </p>
                <p className={'localText'}>Browse or drag images</p>
              </Dragger>
            </div>
          )}
        </TabPane>
        <TabPane tab="By URL" key="url">
          {image ? (
            <ImagePreview image={image} />
          ) : (
            <div className={'sourceContainer'}>
              <p className={'sourceContainerText'}>Image URL:</p>
              <Input
                placeholder="http://"
                className={classNames('sourceContainerInput', 'urlInput')}
                onPressEnter={inputImage}
              />
            </div>
          )}
        </TabPane>
      </Tabs>
    </div>
  );
};

const QRcodeSize = {
  type: 'number',
  id: 'QRSize',
  label: 'Size of each QRcode',
  defaultVal: 200,
  minVal: 200,
  maxVal: 400,
  step: 100,
};

const eachMsgLen = {
  type: 'number',
  id: 'mxMsgLen',
  label: 'Length of messages in a QRcode',
  defaultVal: 130,
  minVal: 50,
  maxVal: 400,
  step: 30,
};

const stegAlgorithm = {
  type: 'radio',
  id: 'stegAlgorithm',
  label: 'Steg Algorithm',
  options: ['LSB'],
};

const encodeMode = {
  type: 'radio',
  id: 'encMode',
  label: 'Encode Mode',
  options: ['Binary', 'QRcode'],
  child: [QRcodeSize, eachMsgLen],
  showChild: 'QRcode',
};

const ENCODE_SETTING_INFOS = {
  type: 'EncodeSetting',
  title: 'Encode Setting',
  config: [stegAlgorithm, encodeMode],
};

const StegSettingModalWrapper = ({ title, visible, onOk, onCancel, children, style }) => {
  return (
    <Modal
      title={title}
      visible={visible}
      okText={'OK'}
      onOk={onOk}
      cancelText={'Cancel'}
      onCancel={onCancel}
      bodyStyle={{
        paddingTop: 0,
        paddingBottom: '15px',
        ...style,
      }}
      centered
      // destroyOnClose
    >
      {children}
    </Modal>
  );
};

const StegEncodeSettingModal = ({ visible = false, onOk = () => {}, onCancel = () => {} }) => {
  const defaultLSBEncOpts = { encMode: 'binary', QRSize: 200, mxMsgLen: 130 };
  const [curLSBEncOpts, setCurLSBEncOpts] = useState(defaultLSBEncOpts);

  const updateStegConfigItem = (key, value) => {
    if (Object.keys(curLSBEncOpts).includes(key)) {
      if (key === 'encMode' && value === 'Binary') {
        setCurLSBEncOpts(defaultLSBEncOpts);
      } else {
        const newStegConfig = JSON.parse(JSON.stringify(curLSBEncOpts));
        newStegConfig[key] = value;
        setCurLSBEncOpts(newStegConfig);
      }
    }
  };

  const RadioFormItem = (item) => {
    return (
      <Radio.Group
        defaultValue={item.options[0]}
        onChange={(event) => updateStegConfigItem(item.id, event.target.value)}
      >
        {item.options.map((option) => (
          <Radio key={option} value={option}>
            <span> {option} </span>
          </Radio>
        ))}
      </Radio.Group>
    );
  };

  const QRSettingFormItem = (item) => {
    return (
      <div style={{ marginLeft: '0px', width: '320px' }}>
        {RadioFormItem(item)}

        {item.showChild === curLSBEncOpts.encMode && item.child
          ? item.child.map((cItm) => (
              <div style={{ width: '80%', marginTop: '10px' }} key={cItm.id}>
                <label>{cItm.label}</label>
                <InputNumber
                  style={{
                    width: '100%',
                    marginTop: '5px',
                  }}
                  autoFocus={false}
                  size="large"
                  defaultValue={cItm.defaultVal}
                  min={cItm.minVal}
                  max={cItm.maxVal}
                  step={cItm.step}
                  onChange={(value) => updateStegConfigItem(cItm.id, value)}
                />
              </div>
            ))
          : ''}
      </div>
    );
  };

  const renderFormItems = () => {
    const formItems = [];
    ENCODE_SETTING_INFOS.config.map((item, idx) => {
      if (idx === 0) {
        return formItems.push({
          label: item.label,
          children: <div key={item.id}>{RadioFormItem(item)}</div>,
        });
      }
      return formItems.push({
        label: item.label,
        children: QRSettingFormItem(item),
      });
    });

    return (
      <Form name="stegEncSettingForm">
        {formItems.map((item, index) => {
          const { children, ...rest } = item;
          return (
            <Form.Item key={index} {...rest} style={{ flexDirection: 'row', margin: '10px' }}>
              {children}
            </Form.Item>
          );
        })}
      </Form>
    );
  };

  return (
    <StegSettingModalWrapper
      title={ENCODE_SETTING_INFOS.title}
      visible={visible}
      onOk={() => {
        onOk(curLSBEncOpts);
      }}
      onCancel={() => {
        onCancel();
      }}
    >
      <div>{renderFormItems()}</div>
    </StegSettingModalWrapper>
  );
};

const StegSettingModal = ({ props }) => {
  return <StegEncodeSettingModal {...props} />;
};

const EncoderCard = ({ setEncodedImg }) => {
  const [inputSecret, setInputSecret] = useState('');
  const [stopUploadImg, setStopUploadImg] = useState(false);
  const [reloadUpImgPanel, setReloadUpImgPanel] = useState(false);
  const [upImg, setUpImg] = useState();
  const [showEncodeSetting, setShowEncodeSetting] = useState(false);
  const defaultLSBEncOpts = { encMode: 'binary', QRSize: 200, mxMsgLen: 130 };
  const [curLSBEncOpts, setCurLSBEncOpts] = useState(defaultLSBEncOpts);

  const handleEncodeBtn = () => {
    setStopUploadImg(true);
    if (inputSecret === undefined) setInputSecret('');
    encodeImg(upImg, inputSecret, curLSBEncOpts)
      .then((result) => {
        if (result) {
          setEncodedImg(result);
        } else {
          throw new Error('Failed to encode the secret!');
        }
        setStopUploadImg(false);
      })
      .catch(() => {
        // eslint-disable-next-line no-alert
        alert('Failed to encode the secret!');
        // Maybe keep the failed encoding try is better
        // setReloadUpImgPanel(!reloadUpImgPanel);
        // setInputSecret('');
        // setEncodedImg(undefined);
        setStopUploadImg(false);
      });
  };

  const handleEncodeSettingOk = (opts) => {
    const newOpts = JSON.parse(JSON.stringify(opts));
    setCurLSBEncOpts(newOpts);
    setShowEncodeSetting(false);
  };

  const handleEncodeSettingCancel = () => {
    setShowEncodeSetting(false);
  };

  return (
    <Card
      hoverable
      className={'uploadImgPanel'}
      title="Encoder"
      extra={
        <div>
          <Button
            style={{
              float: 'right',
              marginRight: '0px',
              marginBottom: '0px',
            }}
            type="link"
            icon={<SettingOutlined />}
            size={'middle'}
            onClick={() => {
              setShowEncodeSetting(true);
            }}
          />
          <StegSettingModal
            type="EncodeSetting"
            visible={showEncodeSetting}
            onOk={handleEncodeSettingOk}
            onCancel={handleEncodeSettingCancel}
          ></StegSettingModal>
        </div>
      }
    >
      <Spin spinning={stopUploadImg}>
        <UploadImgModal key="Encode" reload={reloadUpImgPanel} setUploadImg={setUpImg}></UploadImgModal>

        <div className={'sourceContainer'}>
          <p className={'sourceContainerText'}>Secret massages:</p>
          <TextArea
            placeholder={'Secrets...'}
            allowClear
            className={classNames('sourceContainerInput', 'secretInput')}
            maxLength={200000}
            onChange={(e) => {
              setInputSecret(e.target.value);
            }}
            value={inputSecret}
          />
        </div>

        <div className={'buttonBox'}>
          <Button
            key={'Cancel'}
            size="large"
            style={{
              width: '45%',
            }}
            onClick={() => {
              setReloadUpImgPanel(!reloadUpImgPanel);
              setInputSecret('');
              setEncodedImg(undefined);
            }}
          >
            Cancel
          </Button>

          <Button
            key={'Encode'}
            size="large"
            type="primary"
            style={{
              width: '45%',
            }}
            onClick={() => handleEncodeBtn()}
          >
            Encode
          </Button>
        </div>
      </Spin>
    </Card>
  );
};

const EncodedImgCard = ({ encodedImg }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div>
        <Button
          style={{
            float: 'right',
            marginRight: '0px',
            marginBottom: '0px',
          }}
          type="link"
          icon={<DownloadOutlined />}
          size={'middle'}
          disabled={!encodedImg}
          onClick={() => {
            if (encodedImg === undefined) throw new Error('Image is undefined');
            downloadPng(encodedImg, 'encodedImg');
          }}
        />
      </div>

      {encodedImg ? (
        <ImagePreview image={encodedImg}></ImagePreview>
      ) : (
        <div className={'localContainer'}>
          <p className={'localLogo'}>
            <PictureFilled />
          </p>
        </div>
      )}
    </div>
  );
};

const EncoderPanel = ({ width }) => {
  const [encodedImg, setEncodedImg] = useState();

  return (
    <div
      style={{
        width: `${width}`,
        marginTop: '25px',
      }}
    >
      <EncoderCard setEncodedImg={setEncodedImg} />

      <Card hoverable className={'uploadImgPanel'} title="Encoded Image">
        <EncodedImgCard encodedImg={encodedImg} />
      </Card>
    </div>
  );
};

const App = () => {
  const stegContent = <EncoderPanel width="500px" />;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout className={'layout'}>
        <Content> {stegContent} </Content>
      </Layout>
    </Layout>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
