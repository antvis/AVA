import React, { useState, useEffect } from 'react';
import { Table, Popconfirm } from 'antd';
import { SettingOutlined, DeleteOutlined } from '@ant-design/icons';
import { prefixCls, uuid } from '../utils';
import { intl, Language } from '../i18n';
import { mock, mockFields, Field, getOptimalCount } from './utils/mockdata';
import { SettingModal } from './SettingModal';

interface DataContentProps {
  language: Language;
  count: number;
  customizeData: Field[];
  onFieldDataChange: (value: any[]) => void;
}

export const DataContent = (props: DataContentProps) => {
  const { language, onFieldDataChange, customizeData } = props;
  const [editingIndex, setEditingIndex] = useState<number>(null);
  const [tableFields, setFields] = useState<Field[]>(mockFields);
  const [count, setCount] = useState<number>(props.count || 20);

  const setNewData = (newFields: Field[]) => {
    const optimal = getOptimalCount(newFields);
    const newCount = Number.isNaN(optimal) ? count : optimal;
    const mockData = mock(newFields, newCount);
    setEditingIndex(null);
    setCount(newCount);
    setFields(newFields);
    onFieldDataChange(mockData);
  };

  const onEdit = (index) => {
    setEditingIndex(index);
  };

  const onClear = (index) => {
    const newFields = [...tableFields];
    newFields.splice(index, 1);
    setNewData(newFields);
  };

  const onSetChange = (resetField: Field) => {
    const newFields = [...tableFields];
    newFields.splice(editingIndex, 1, resetField);
    setNewData(newFields);
  };

  useEffect(() => {
    const mockData = mock(tableFields, props.count);
    setCount(props.count);
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
              <SettingOutlined onClick={() => onEdit(index)} />
              <Popconfirm title={intl.get('Are you sure to delete row?', language)} onConfirm={() => onClear(index)}>
                <DeleteOutlined />
              </Popconfirm>
            </span>
          ),
          key: `col-${index + 1}`,
          width: '25%',
          dataIndex: name,
        };
      }
      return {
        title: (
          <span className="table-title">
            --
            <SettingOutlined onClick={() => onEdit(index)} />
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
        dataSource={customizeData.slice(0, 100).map((item) => ({ ...item, __uuid: uuid() }))}
        columns={columnsRender()}
        pagination={false}
      />
      {editingIndex !== null && (
        <SettingModal
          value={tableFields[editingIndex] || { name: '', type: null }}
          onOK={onSetChange}
          language={language}
          onCancel={() => setEditingIndex(null)}
        />
      )}
    </div>
  );
};
