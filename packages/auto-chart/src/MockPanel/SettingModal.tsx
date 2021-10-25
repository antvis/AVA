/**
 * use moment not dayjs because use https://ant.design/docs/react/replace-moment
 * file build smaller is not obvious and language switching is unavailable
 * */
import React, { useState } from 'react';
import moment from 'moment';
import { Input, Modal, Form, Select, InputNumber, DatePicker } from 'antd';
import { intl, Language } from '../i18n';
import { Field, ValuesField, DateField, NumberField } from './utils/mockdata';

const { Option } = Select;

const formItemLayout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};

interface ModalProps {
  value?: Field;
  language: Language;
  onOK(value: Field): void;
  onCancel(): void;
}

export const SettingModal = (props: ModalProps) => {
  const { language, value } = props;
  const [dataType, setDataType] = useState<string>(value?.type || '');
  const [formRef] = Form.useForm();
  const intlget = (key) => {
    return intl.get(key, language);
  };

  const onOk = () => {
    formRef
      .validateFields()
      .then((res) => {
        const newFields = { ...res };
        if (dataType === 'enum') {
          const newValues = res.values.split(',').filter((item) => {
            return item.trim().length > 0;
          });
          newFields.values = newValues;
        }
        if (dataType === 'date') {
          newFields.start = moment(res.start).format('YYYY-MM-DD HH:mm:ss');
          newFields.end = moment(res.end).format('YYYY-MM-DD HH:mm:ss');
        }
        props.onOK(newFields);
      })
      .catch((errInfo) => {
        throw new Error(errInfo);
      });
  };

  return (
    <Modal
      style={{ top: 10 }}
      title={intl.get('Settings', language)}
      visible={true}
      onOk={onOk}
      onCancel={props.onCancel}
    >
      <Form {...formItemLayout} form={formRef}>
        <Form.Item
          name="name"
          rules={[{ required: true, message: intlget('Please input field name') }]}
          label={intlget('Field Name')}
          initialValue={value.name}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="type"
          label={intlget('Field Type')}
          rules={[{ required: true, message: intlget('Please select field type') }]}
          initialValue={value.type}
        >
          <Select allowClear={false} onChange={(selectType) => setDataType(selectType as string)}>
            <Option value="date">{intlget('date')}</Option>
            <Option value="enum">{intlget('enum')}</Option>
            <Option value="number">{intlget('number')}</Option>
          </Select>
        </Form.Item>
        {dataType === 'date' && (
          <>
            <Form.Item
              name="start"
              label={intlget('Start Time')}
              rules={[{ required: true, message: intlget('Start time is required') }]}
              initialValue={(value as DateField).start ? moment((value as DateField).start) : moment()}
            >
              <DatePicker showTime />
            </Form.Item>
            <Form.Item
              name="end"
              label={intlget('End Time')}
              rules={[
                { required: true, message: intlget('End time is required') },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const startTime = getFieldValue('start');
                    if (value && getFieldValue('start')) {
                      if (moment(value).unix() < moment(startTime).unix()) {
                        return Promise.reject(new Error('End time must be bigger than Start Time'));
                      }
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
              initialValue={(value as DateField).end ? moment((value as DateField).end) : moment()}
            >
              <DatePicker showTime />
            </Form.Item>
            <Form.Item
              name="step"
              label={intlget('Time Span')}
              help={intlget('s:second m:minute h:hour d:day e.g.5m')}
              rules={[
                { required: true, message: intlget('Time span is required') },
                {
                  validator: (_rule, value, callback) => {
                    const reg = /^[0-9]+[smhd]$/;
                    if (parseInt(value, 10) === 0 || !reg.test(value)) {
                      return callback('Time Span Format is wrong');
                    }
                    return callback();
                  },
                },
              ]}
              initialValue={(value as DateField).step || '1d'}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="format"
              label={intlget('Format')}
              help={intlget('y: year M:month d:day H:hour m:minute s:second e.g.yyyy/MM/dd')}
              rules={[
                { required: true, message: intlget('Time format is required') },
                {
                  validator: (_rule, value, callback) => {
                    const sameStr = '[^yYMmDdHhMmSs]';
                    const sameOr = `$|${sameStr}$|${sameStr}`;
                    const regStr = `^yyyy(${sameOr}MM(${sameOr}dd(${sameOr} HH(${sameOr}mm(${sameOr}ss)))))`;
                    const reg = new RegExp(regStr);
                    if (!reg.test(value)) {
                      return callback('Format is wrong');
                    }
                    return callback();
                  },
                },
              ]}
              initialValue={(value as DateField).format || 'yyyy/MM/dd'}
            >
              <Input />
            </Form.Item>
          </>
        )}
        {dataType === 'enum' && (
          <>
            <Form.Item
              name="values"
              label={intlget('Enumeration')}
              help={intlget('split with ","')}
              rules={[
                { required: true, message: intlget('Enumeration is required') },
                {
                  validator: (_rule, value, callback) => {
                    const reg = /,,/;
                    if (value && reg.test(value)) {
                      return callback('Time Span Format is wrong');
                    }
                    return callback();
                  },
                },
              ]}
              initialValue={(value as ValuesField).values ? (value as ValuesField).values.join(',') : ''}
            >
              <Input.TextArea />
            </Form.Item>
            <Form.Item
              name="distribution"
              label={intlget('Distribution')}
              rules={[{ required: true, message: intlget('Distribution is required') }]}
              initialValue={(value as ValuesField).distribution}
            >
              <Select>
                <Option value="cartesian">{intlget('cartesian')}</Option>
                <Option value="random">{intlget('random')}</Option>
                <Option value="sequential">{intlget('sequential')}</Option>
              </Select>
            </Form.Item>
          </>
        )}
        {dataType === 'number' && (
          <>
            <Form.Item
              name="min"
              label={intlget('Minimum')}
              rules={[{ required: true, message: intlget('Minimum is required') }]}
              initialValue={(value as NumberField).min || 0}
            >
              <InputNumber />
            </Form.Item>
            <Form.Item
              name="max"
              label={intlget('Maximum')}
              rules={[
                { required: true, message: intlget('Maximum is required') },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (value && getFieldValue('min') && value <= getFieldValue('min')) {
                      return Promise.reject(new Error('Max number must be bigger than Small number'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
              initialValue={(value as NumberField).max || 0}
            >
              <InputNumber />
            </Form.Item>
            <Form.Item
              name="decimals"
              label={intlget('Precision')}
              rules={[{ required: true, message: intlget('Precision is required') }]}
              initialValue={(value as NumberField).decimals || 0}
            >
              <InputNumber min={0} step={1} />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};
