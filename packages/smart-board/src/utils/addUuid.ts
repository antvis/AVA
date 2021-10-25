import { v4 as uuidv4 } from 'uuid';
import { InputChart } from '../interfaces';

export function addUuid(chart: InputChart): InputChart {
  if (chart.id) {
    throw new Error('Chart ID already exists, please do not add it again.');
  } else {
    const a = chart;
    a.id = uuidv4();
  }
  return chart;
}
