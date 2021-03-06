/**
 * @author Don McCurdy / https://www.donmccurdy.com
 */

import { TempNode } from 'three/examples/jsm/nodes/core/TempNode.js';
import { FunctionNode } from 'three/examples/jsm/nodes/core/FunctionNode.js';

const src = `
float remap ( float value, vec2 domain, vec2 range ) {

    return range.x + ( value - domain.x ) * ( range.y - range.x ) / ( domain.y - domain.x );

}

vec2 remap ( vec2 value, vec2 domain, vec2 range ) {

    return range.x + ( value - domain.x ) * ( range.y - range.x ) / ( domain.y - domain.x );

}

vec3 remap ( vec3 value, vec2 domain, vec2 range ) {

    return range.x + ( value - domain.x ) * ( range.y - range.x ) / ( domain.y - domain.x );

}

vec4 remap ( vec4 value, vec2 domain, vec2 range ) {

    return range.x + ( value - domain.x ) * ( range.y - range.x ) / ( domain.y - domain.x );

}
`;

function RemapNode( node, domain, range ) {

  TempNode.call(this, 'f');

  this.value = node;
  this.domain = domain;
  this.range = range;

}

RemapNode.prototype = Object.create(TempNode.prototype);
RemapNode.prototype.constructor = RemapNode;
RemapNode.prototype.nodeType = "Remap";

RemapNode.Nodes = (function () {

  return {
    remap: new FunctionNode( src.trim() )
  };

})();

RemapNode.prototype.generate = function (builder, output) {

  var remap = builder.include( RemapNode.Nodes.remap );

  return builder.format( remap + '( ' + [
    this.value.build( builder ),
    this.domain.build(builder, 'vec2'),
    this.range.build(builder, 'vec2')
  ].join(', ') + ' )', this.getType( builder ), output );

};

RemapNode.prototype.getType = function ( builder ) {

  return this.value.getType( builder );

};

RemapNode.prototype.copy = function (source) {

  TempNode.prototype.copy.call(this, source);

  this.value = source.value;
  this.domain = source.domain;
  this.range = source.range;

};

RemapNode.prototype.toJSON = function (meta) {

  var data = this.getJSONNode(meta);

  if (!data) {

    data = this.createJSONNode(meta);

    data.value = this.value.toJSON(meta).uuid;
    data.domain = this.domain.toJSON(meta).uuid;
    data.range = this.range.toJSON(meta).uuid;

  }

  return data;

};

export { RemapNode };
