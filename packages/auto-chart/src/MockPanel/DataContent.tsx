import React, { useState, useEffect } from 'react';
import { Table, Popconfirm } from 'antd';
import { SettingOutlined, DeleteOutlined } from '@ant-design/icons';
import { prefixCls, uuid } from '../utils';
import { intl, Language } from '../i18n';
import { SettingModal } from './SettingModal';
import { mock, Field, getOptimalCount } from './utils/mockdata';


const fields: Field[] = [
  { type: 'date', start: '2019-01-01', end: '2019-01-10', step: '1d', format: 'yyyy/MM/dd', name: 'date' },
  { type: 'enum', values: ['Shanghai', 'London'], distribution: 'cartesian', name: 'city' },
  { type: 'number', name: 'count', min: 0, max: 1000, decimals: 0 },
];

interface DataContentProps {
  language: Language;
  count: number;
  onFieldDataChange: (value: any[]) => void;
};

export const DataContent = (props: DataContentProps) => {
  const { language, onFieldDataChange } = props;
  const [editingIndex, setEditingIndex] = useState<number>(null);
  const [tableFields, setFields] = useState<Field[]>(fields);
  const [count, setCount] = useState<number>(props.count || 20);
  const [customizeData, setCustomizeData] = useState<any[]>(mock(fields, 20));

  const onEdit = (index) => {
    setEditingIndex(index);
  };

  const onClear = (index) => {
    const newFields = [...tableFields];
    newFields.splice(index, 1);
    const optimal = getOptimalCount(newFields);
    const newCount = Number.isNaN(optimal) ? count : optimal;
    const mockData = mock(newFields, newCount);
    setCount(newCount);
    setFields(newFields);
    setCustomizeData(mockData);
    onFieldDataChange(mockData);
  };

  const onSetChange = (resetField: Field) => {
    const newFields = [...tableFields];
    newFields.splice(editingIndex, 1, resetField);
    const optimal = getOptimalCount(newFields);
    const newCount = Number.isNaN(optimal) ? count : optimal;
    const mockData = mock(newFields, newCount);
    setEditingIndex(null);
    setCount(newCount);
    setFields(newFields);
    setCustomizeData(mockData);
    onFieldDataChange(mockData);
  };

  useEffect(() => {
    const mockData = mock(tableFields, props.count);
    setCount(props.count);
    setCustomizeData(mockData);
    onFieldDataChange([...mockData]);
  }, [props.count]);

  const columnsRender = () => {
    return new Array(4).fill(undefined).map((_, index) => {
      if (tableFields[index]) {
        const { name } = tableFields[index];
        return {
          title: (
            <span className="table-title">
              {name}
              <SettingOutlined onClick={() => onEdit(index)}/>
              <Popconfirm 
                title={intl.get('Are you sure to delete row?', language)}
                onConfirm={() => onClear(index)}>
                <DeleteOutlined />
              </Popconfirm>
            </span>
          ),
          key: `col-${index + 1}`,
          width: '25%',
          dataIndex: name,
        };
      };
      return {
        title: (
          <span className="table-title">
            --
            <SettingOutlined onClick={() => onEdit(index)}/>
          </span>
        ),
        key: `col-${index + 1}`,
        width: '25%',
        render() {
          return '--';
        },
      };
    });
  };

  return (
    <div className={`${prefixCls}mockdata-container`}>
      <Table
        rowKey="__uuid"
        scroll={{ y: 360 }}
        dataSource={customizeData.slice(0, 100).map(item => ({ ...item, __uuid: uuid() }))}
        columns={columnsRender()}
        pagination={false}
      />
    {editingIndex !== null && (
      <SettingModal
        value={tableFields[editingIndex] || {}}
        onOK={onSetChange}
        language={language}
        onCancel={() => setEditingIndex(null)}
      />
    )}
  </div>
  );
};

