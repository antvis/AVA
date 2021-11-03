/* eslint react/prop-types: 0 */

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import QRCode from 'qrcode';
import Pica from 'pica';
import { Upload, Layout, Card, Button, Spin, Typography, Popover, Image, Modal, Radio, Form, Tabs, Input } from 'antd';
import { SettingOutlined, ShareAltOutlined, PictureFilled } from '@ant-design/icons';
import { LSBSteg } from '@antv/vis-steg';

import './index.less';

const { Dragger } = Upload;
const { TabPane } = Tabs;
const { Paragraph } = Typography;
const { Content } = Layout;

async function generateQRbase64(msg, QRSize = 200) {
  const QRcanvas = await QRCode.toCanvas(`${msg}`, { errorCorrectionLevel: 'H' });
  const offScreenCanvas = document.createElement('canvas');
  offScreenCanvas.width = QRSize;
  offScreenCanvas.height = QRSize;
  const picaResizer = new Pica();
  await picaResizer.resize(QRcanvas, offScreenCanvas, {
    unsharpAmount: 160,
    unsharpRadius: 0.6,
    unsharpThreshold: 1,
  });

  return offScreenCanvas.toDataURL('image/png');
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

const DecodeSecretCard = ({ decSecret }) => {
  const [useTrigger, setUseTrigger] = useState('');
  const [btnDisabled, setBtnDisabled] = useState(true);
  const [QRbase64, setQRbase64] = useState('');

  useEffect(() => {
    async function getQRbase64(msg, QRSize = 200) {
      const res = await generateQRbase64(msg, QRSize);
      setQRbase64(res);
      return res;
    }
    if (decSecret.length > 0 && decSecret.length <= 150) {
      getQRbase64(decSecret);
      setUseTrigger('hover');
      setBtnDisabled(false);
    } else {
      setQRbase64('');
      setUseTrigger('');
      setBtnDisabled(true);
    }
  }, [decSecret]);

  return (
    <Card hoverable className={'uploadImgPanel'} title="Decoded Secrets">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            direction: 'rtl',
          }}
        >
          <div>
            <Popover
              content={
                <div>
                  <ImagePreview image={QRbase64}></ImagePreview>
                </div>
              }
              trigger={useTrigger}
            >
              <Button
                style={{
                  marginTop: '-5px',
                }}
                type="link"
                icon={<ShareAltOutlined />}
                size={'middle'}
                disabled={btnDisabled}
              />
            </Popover>
          </div>

          <div>
            <Paragraph
              style={{
                // float: 'right',
                marginRight: '0px',
                marginBottom: '0px',
              }}
              copyable={{ text: decSecret }}
            ></Paragraph>
          </div>
        </div>

        <Paragraph>
          <pre>
            <div
              id="test"
              style={{
                overflow: 'auto',
                minHeight: '10px',
                maxHeight: '300px',
              }}
            >
              {decSecret}
            </div>
          </pre>
        </Paragraph>
      </div>
    </Card>
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

async function decodeImg(imgUrl, stegOpts, stegMethod = 'lsb') {
  try {
    const opts = initOptions(stegOpts, { decMode: 'binary' });
    const { decMode } = opts;
    const img = await loadImg(imgUrl);
    const encImgCanvas = document.createElement('canvas');
    const encImgcontext = encImgCanvas.getContext('2d');
    encImgCanvas.width = img.width;
    encImgCanvas.height = img.height;
    encImgcontext.drawImage(img, 0, 0);
    const encodedImgData = encImgcontext.getImageData(0, 0, img.width, img.height);
    const encodedImgBitmap = Array.from(encodedImgData.data);
    let decodeSecret = '';
    if (stegMethod === 'lsb') {
      const testLSBSteg = new LSBSteg();
      decodeSecret = await testLSBSteg.readLSB({
        imgBitmapData: encodedImgBitmap,
        imgHeight: img.height,
        imgWidth: img.width,
        decMode,
      });
    }
    if (decodeSecret == null || decodeSecret.length === 0) {
      throw new Error('Failed to decode the secret');
    }
    return decodeSecret;
  } catch (err) {
    return undefined;
  }
}

const stegAlgorithm = {
  type: 'radio',
  id: 'stegAlgorithm',
  label: 'Steg Algorithm',
  options: ['LSB'],
};

const decodeMode = {
  type: 'radio',
  id: 'decMode',
  label: 'Decode Mode',
  options: ['Binary', 'QRcode'],
};

const DECODE_SETTING_INFOS = {
  type: 'DecodeSetting',
  title: 'Decode Setting',
  config: [stegAlgorithm, decodeMode],
};

const StegDecodeSettingModal = ({ visible = false, onOk = () => {}, onCancel = () => {} }) => {
  const defaultLSBDecOpts = { decMode: 'binary' };
  const [curLSBDecOpts, setCurLSBDecOpts] = useState(defaultLSBDecOpts);

  const updateStegConfigItem = (key, value) => {
    if (Object.keys(curLSBDecOpts).includes(key)) {
      const newStegConfig = JSON.parse(JSON.stringify(curLSBDecOpts));
      newStegConfig[key] = value;
      setCurLSBDecOpts(newStegConfig);
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

  const renderFormItems = () => {
    const formItems = [];
    DECODE_SETTING_INFOS.config.map((item) => {
      return formItems.push({
        label: item.label,
        children: <div key={item.id}>{RadioFormItem(item)}</div>,
      });
    });

    return (
      <Form name="stegDecSettingForm">
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
    <Modal
      title={DECODE_SETTING_INFOS.title}
      visible={visible}
      okText={'OK'}
      onOk={() => {
        onOk(curLSBDecOpts);
      }}
      cancelText={'Cancel'}
      onCancel={() => {
        onCancel();
      }}
      bodyStyle={{
        paddingTop: 0,
        paddingBottom: '15px',
      }}
      centered
    >
      <div>{renderFormItems()}</div>
    </Modal>
  );
};

const StegSettingModal = (props) => {
  return <StegDecodeSettingModal {...props} />;
};

const DecoderCard = ({ setDecSecret }) => {
  const [stopUploadImg, setStopUploadImg] = useState(false);
  const [reloadUpImgPanel, setReloadUpImgPanel] = useState(false);
  const [upImg, setUpImg] = useState();
  const [showDecodeSetting, setShowDecodeSetting] = useState(false);
  const defaultLSBDecOpts = { decMode: 'binary' };
  const [curLSBDecOpts, setCurLSBDecOpts] = useState(defaultLSBDecOpts);

  const handleDecodeBtn = () => {
    setStopUploadImg(true);
    decodeImg(upImg, curLSBDecOpts)
      .then((result) => {
        if (result) {
          setDecSecret(result);
        } else {
          throw new Error('Failed to decode the secret!');
        }
        setStopUploadImg(false);
      })
      .catch(() => {
        // eslint-disable-next-line no-alert
        alert('Failed to decode the secret!');
        // Maybe keep the failed decoding try is better
        // setReloadUpImgPanel(!reloadUpImgPanel);
        setDecSecret('');
        setStopUploadImg(false);
      });
  };

  const handleDecodeSettingOk = (opts) => {
    const newOpts = JSON.parse(JSON.stringify(opts));
    setCurLSBDecOpts(newOpts);
    setShowDecodeSetting(false);
  };

  const handleDecodeSettingCancel = () => {
    setShowDecodeSetting(false);
  };

  return (
    <Card
      hoverable
      className={'uploadImgPanel'}
      title="Decoder"
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
              setShowDecodeSetting(true);
            }}
          />
          <StegSettingModal
            type="DecodeSetting"
            visible={showDecodeSetting}
            onOk={handleDecodeSettingOk}
            onCancel={handleDecodeSettingCancel}
          ></StegSettingModal>
        </div>
      }
    >
      <Spin spinning={stopUploadImg}>
        <UploadImgModal key="Decode" reload={reloadUpImgPanel} setUploadImg={setUpImg}></UploadImgModal>

        <div className={'buttonBox'}>
          <Button
            key={'Cancel'}
            size="large"
            style={{
              width: '45%',
            }}
            onClick={() => {
              setReloadUpImgPanel(!reloadUpImgPanel);
              setDecSecret('');
            }}
          >
            Cancel
          </Button>

          <Button
            key={'Decode'}
            size="large"
            type="primary"
            style={{
              width: '45%',
            }}
            onClick={() => handleDecodeBtn()}
          >
            Decode
          </Button>
        </div>
      </Spin>
    </Card>
  );
};

const DecoderPanel = ({ width }) => {
  const [decSecret, setDecSecret] = useState('');

  return (
    <div
      style={{
        width: `${width}`,
        marginTop: '25px',
      }}
    >
      <DecoderCard setDecSecret={setDecSecret} />

      <DecodeSecretCard decSecret={decSecret} />
    </div>
  );
};

const App = () => {
  const stegContent = <DecoderPanel width="500px" />;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout className={'layout'}>
        <Content> {stegContent} </Content>
      </Layout>
    </Layout>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
