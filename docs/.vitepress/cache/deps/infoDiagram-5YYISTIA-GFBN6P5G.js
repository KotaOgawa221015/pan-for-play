import {
  parse
} from "./chunk-BIZKQYMA.js";
import "./chunk-HD2V4PDA.js";
import "./chunk-RDD3V7ZB.js";
import "./chunk-4MFX6HJP.js";
import "./chunk-Z5EM47JQ.js";
import "./chunk-LDXBD5EX.js";
import "./chunk-N2QZY32P.js";
import "./chunk-7WTN4EFY.js";
import "./chunk-DA6NLRJK.js";
import "./chunk-S6KOWPKD.js";
import "./chunk-UVTR36U7.js";
import "./chunk-7MUBAYHL.js";
import {
  selectSvgElement
} from "./chunk-IWLICCHX.js";
import {
  configureSvgSize
} from "./chunk-IIQWBOVL.js";
import {
  __name,
  log
} from "./chunk-XXDMU5XJ.js";
import "./chunk-DC5AMYBS.js";

// node_modules/.pnpm/mermaid@11.15.0/node_modules/mermaid/dist/chunks/mermaid.core/infoDiagram-5YYISTIA.mjs
var parser = {
  parse: __name(async (input) => {
    const ast = await parse("info", input);
    log.debug(ast);
  }, "parse")
};
var DEFAULT_INFO_DB = {
  version: "11.15.0" + (true ? "" : "-tiny")
};
var getVersion = __name(() => DEFAULT_INFO_DB.version, "getVersion");
var db = {
  getVersion
};
var draw = __name((text, id, version) => {
  log.debug("rendering info diagram\n" + text);
  const svg = selectSvgElement(id);
  configureSvgSize(svg, 100, 400, true);
  const group = svg.append("g");
  group.append("text").attr("x", 100).attr("y", 40).attr("class", "version").attr("font-size", 32).style("text-anchor", "middle").text(`v${version}`);
}, "draw");
var renderer = { draw };
var diagram = {
  parser,
  db,
  renderer
};
export {
  diagram
};
//# sourceMappingURL=infoDiagram-5YYISTIA-GFBN6P5G.js.map
