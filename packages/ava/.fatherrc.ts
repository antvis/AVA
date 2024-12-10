import fatherConfig from '../../.fatherrc';
import path from 'path';

export default fatherConfig('ts', 'AVA', {
  alias: {
    '@ava': path.resolve(__dirname, 'src'),
    '@advisor': path.resolve(__dirname, 'src/advisor'),
  }
});
