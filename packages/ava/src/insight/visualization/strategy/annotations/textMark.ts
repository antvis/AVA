
import { dataFormat } from "../../util";

export const annotationText = (texts: Text[], position: [number | string, number | string], offsetY: number = 0) => {

// low variance text
// {
//   type: 'text',
//   position: ['min', mean],
//   content: 'mean',
//   offsetX: -28,
//   offsetY: -4,
//   style: {
//     textBaseline: 'bottom',
//     fill: COLOR.highlight,
//   },
// },


  return texts.map((text, i) => ({
    type: 'text',
    content: dataFormat(text.content),
    position,
    offsetY: offsetY + i * 15,
    style: {
      ...TEXT_STYLE,
      ...text.style,
    },
  }));
}
