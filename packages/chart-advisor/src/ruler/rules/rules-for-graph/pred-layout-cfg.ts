import { RuleModule } from './concepts/rule';
import { ILayoutConfig, LayoutTypes } from '../../../interface';
import { DEFAULT_LAYOUT_TYPE } from './const';

export const layoutConfigPredRule: RuleModule = {
  id: 'pred-layout-config',
  type: 'DESIGN',
  docs: {
    detailedText: '',
  },
  /**
   * 传入optimizer的dataProps中需有layoutType属性
   */
   optimizer: (dataProps):ILayoutConfig => {
    const type:LayoutTypes= dataProps.layoutType || DEFAULT_LAYOUT_TYPE;
    // const fieldForCluster 
    let options: ILayoutConfig['options'] = {};

    switch (type as LayoutTypes) {
      case 'graphin-force': {
        options = {
          stiffness: 200, // 边作用力 [1, 500] 
          repulsion: 1000, // 节点作用力 [-100, 2000] 
          damping: 0.9, // 阻尼系数 [0,1] 
        }
        break;
      }
      case 'force': {
        options = {
          linkDistance: 100, // [1, 500]
          nodeStrength: 100, // [-100, 500]
          edgeStrength: 0.2, // [0,1] 
          nodeSpacing: 15, // [0, 200]
          preventOverlap: true,
          clustering: true, 
          nodeSize: (d:any) => {
            return d.size;
          },
          // clusterNodeSize: (d:any) => {
          //   return d.size;
          // },
          // clusterEdgeDistance: 200,
          // clusterFociStrength: 0.5,
        }
        break;
      }
      case 'dagre': {
        options = {
          rankdir: 'TB',  // TB, BT, LR, RL
          align: null, // 'UL', 'UR', 'DL', 'DR'
          nodesep: 10, // [1, 200]
          ranksep: 10, // [1, 200]
        }
        break;
      }
      case 'radial': {
        options = {
          unitRadius: 100, // [1, 500] 
          // focusNode: '' // '中心节点',
          nodeSpacing: 15, // [0, 200]
          preventOverlap: true
        }
        break;
      }
      case 'concentric': {
        options = {
          sortBy: null, // null,'topology', 'degree'  
          nodeSize: 15, // [0,200]
          minNodeSpacing: 10, // 最小间距 [5, 50]
          equidistant: false, // 是否等间距
          preventOverlap: true,
      }
        break;
      }
      case 'circular': {
        options = {
          radius: 100, // [5, 2500]
          divisions: 1, // [1, 10]
          ordering: null, // [null, 'topology', 'degree']
          preventOverlap: true
        }
        break;
      }
      case 'grid': {
        options = {
          rows: 1, // [1,15]
          cols: 1, // [1, 15] 
          sortBy: null,  // null, 'topology', 'degree'
        }
        break;
      }
      default:
    }
    const layoutCfg = {
      type,
      options
    }
    return layoutCfg
  }
}
