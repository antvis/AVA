import {concaveHull, concaveHullArea, concaveHullLength, convexHull, convexHullArea} from "./findScag/hulls"

if (!window) {
    window = self;
}
const hulls = {};

hulls.concaveHull = concaveHull;
hulls.concaveHullArea = concaveHullArea;
hulls.concaveHullLength = concaveHullLength;
hulls.convexHull = convexHull;
hulls.convexHullArea = convexHullArea;

//Export to windows
window.hulls = hulls;
