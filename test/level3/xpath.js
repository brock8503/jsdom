exports.tests = {};

function all1(re, s) {
  var l = [];
  while (s.length) {
    var m = re.exec(s);
    if (!m) break;
    l.push(m[1]);
    s = s.substr(m[0].length);
  }
  return l;
}
exports.testTokenizeRegexp = function(test) {
  var re = xpath.Stream.prototype.re;
  test.deepEqual(['8', 'a'], all1(re, '8a'));
  test.deepEqual(['8', 'a'], all1(re, ' 8a'));
  test.deepEqual(['fun'], all1(re, 'fun'));
  test.deepEqual(['hi', '+', '3'], all1(re, 'hi+3'));
  test.deepEqual(['fun', '(', ')'], all1(re, 'fun()'));
  test.deepEqual(['..', '/', 'a', '//', 'b'], all1(re, '../a//b'));
  test.deepEqual(['1', '<=', '2', '<', '3', '>=', '4', '=', '5', '!=', '6'], all1(re, '1<=2<3>=4=5!=6'));
  test.deepEqual(['<', '='], all1(re, '< ='));
  test.deepEqual(['a','::','b'], all1(re, 'a::b'));
  test.deepEqual(['a','::','b'], all1(re, 'a :: b'));
  test.deepEqual(['a:b'], all1(re, 'a:b'));
  test.deepEqual(['a'], all1(re, 'a : b'));  // can't tokenize : alone
  test.deepEqual(['a:b', '::', 'c'], all1(re, 'a:b::c'));
  test.deepEqual(['a', '::', 'b:c'], all1(re, 'a::b:c'));
  test.deepEqual(['a', '::', 'b:c'], all1(re, 'a::b:c'));
  test.deepEqual(['"hi there\'"'], all1(re, '"hi there\'"'));
  test.deepEqual(['*'], all1(re, '*'));
  test.deepEqual(['ncname:*'], all1(re, 'ncname:*'));
  test.deepEqual(['q:name'], all1(re, 'q:name:*'));  // can't tokenize : alone
  test.deepEqual(['-', 'b'], all1(re, '-b'));
  test.deepEqual(['a-b'], all1(re, 'a-b'));
  test.deepEqual(['a', '-', 'b'], all1(re, 'a -b'));
  test.deepEqual(['a', '-', 'b'], all1(re, 'a - b'));
  test.deepEqual(['.3'], all1(re, '.3'));
  test.done();
};
exports.testPeekPop = function(test) {
  var s = new xpath.Stream('a b c');
  test.equals('a', s.peek());
  test.equals(' b c', s.str);
  test.equals('a', s.pop());
  test.equals('b', s.pop());
  test.equals('c', s.pop());
  test.equals(null, s.pop());
  test.done();
};
exports.testPopFuncName = function(test) {
  var s = new xpath.Stream('f( node( mod( string( comment()))))');
  test.equals('f', s.trypopfuncname());
  test.equals('(', s.pop());
  test.equals(null, s.trypopfuncname());
  test.equals('node', s.pop());
  test.equals('(', s.pop());
  test.equals('mod', s.trypopfuncname());
  test.equals('(', s.pop());
  test.equals('string', s.trypopfuncname());
  test.equals('(', s.pop());
  test.equals(null, s.trypopfuncname());
  test.equals('comment', s.pop());
  test.equals('(', s.pop());
  test.equals(')', s.pop());
  test.equals(')', s.pop());
  test.equals(')', s.pop());
  test.equals(')', s.pop());
  test.equals(')', s.pop());
  test.equals(null, s.trypopfuncname());
  test.equals(null, s.pop());
  test.done();
};
exports.testPopFuncWithSpaces = function(test) {
  var s = new xpath.Stream('f(n-s(" "), 2, 3)');
  test.equals('f', s.trypopfuncname());
  test.equals('(', s.pop());
  test.equals('n-s', s.trypopfuncname());
  test.equals('(', s.pop());
  test.equals(' ', s.trypopliteral());
  test.equals(')', s.pop());
  test.equals(',', s.pop());
  test.equals('2', s.pop());
  test.equals(',', s.pop());
  test.equals('3', s.pop());
  test.equals(')', s.pop());
  test.equals(null, s.pop());
  test.done();
};
exports.testTryPopNameTest = function(test) {
  var s = new xpath.Stream('a:b + c:* + *');
  test.equals('a:b', s.trypopnametest());
  test.equals(null, s.trypopnametest());
  test.equals('+', s.pop());
  test.equals('c:*', s.trypopnametest());
  test.equals(null, s.trypopnametest());
  test.equals('+', s.pop());
  test.equals('*', s.trypopnametest());
  test.equals(null, s.trypopnametest());
  test.equals(null, s.pop());
  test.done();
};
exports.testTryPopLiteral = function(test) {
  var s = new xpath.Stream('"ab" + \'c d\' e "');  // dangling " at end
  test.equals('ab', s.trypopliteral());
  test.equals(null, s.trypopliteral());
  test.equals('+', s.pop());
  test.equals('c d', s.trypopliteral());
  test.equals(null, s.trypopliteral());
  test.equals('e', s.pop());
  test.equals(null, s.trypopliteral());  // dangling " doesn't become a token.
  test.equals(null, s.pop());
  test.done();
};
exports.testTryPopNumber = function(test) {
  var s = new xpath.Stream('.2 + 3.4 -5 .');
  test.equals(.2, s.trypopnumber());
  test.equals(null, s.trypopnumber());
  test.equals('+', s.pop());
  test.equals('3.4', s.trypopnumber());
  test.equals(null, s.trypopnumber());
  test.equals('-', s.pop());
  test.equals('5', s.trypopnumber());

  // . by itself isn't a number.
  test.equals(null, s.trypopnumber());
  test.equals('.', s.pop());

  test.equals(null, s.trypopnumber());  // dangling " doesn't become a token.
  test.equals(null, s.pop());
  test.done();
};
exports.testTryPopVarRef = function(test) {
  var s = new xpath.Stream('$a + $b:c $');
  test.equals('a', s.trypopvarref());
  test.equals(null, s.trypopvarref());
  test.equals('+', s.pop());
  test.equals('b:c', s.trypopvarref());
  test.equals(null, s.trypopvarref());
  test.equals(null, s.pop());
  test.done();
};
var astFactory = {
  node: function() {return Array.prototype.slice.call(arguments);},
  i: 0,
};
exports.testParseNumber = function(test) {
  var s = new xpath.Stream('32');
  test.deepEqual(32, xpath.parse(s, astFactory));
  test.done();
};
exports.testParseLiteral = function(test) {
  var s = new xpath.Stream('"hi"');
  test.deepEqual("hi", xpath.parse(s, astFactory));
  test.done();
};
exports.testParseFunctionCall = function(test) {
  var s = new xpath.Stream('concat(1, 1+1, "hi")');
  test.deepEqual(['FunctionCall', 'concat', [1, ['+', 1, 1], 'hi']], xpath.parse(s, astFactory));
  test.done();
};
exports.testParseFunctionOfEmptyString = function(test) {
  var s = new xpath.Stream('string("")');
  test.deepEqual(['FunctionCall', 'string', [""]], xpath.parse(s, astFactory));
  test.done();
};
exports.testParseVariableReference = function(test) {
  var s = new xpath.Stream('$hi');
  test.deepEqual(['VariableReference', 'hi'], xpath.parse(s, astFactory));
  test.done();
};
exports.testParsePrimative = function(test) {
  var s = new xpath.Stream('32 + -1 + "3"');
  test.deepEqual(['+', ['+', 32, ['UnaryMinus', 1]], '3'], xpath.parse(s, astFactory));
  test.done();
};
exports.testPrimaryParens = function(test) {
  var s = new xpath.Stream('(div)');
  test.deepEqual(['PathExpr', ['Axis', 'child', 'element', 'div']], xpath.parse(s, astFactory));
  test.done();
};
exports.testParseStepShorthands = function(test) {
  var s = new xpath.Stream('../.');
  test.deepEqual(
    [ 'PathExpr',
      [ '/',
        [ 'Axis', 'parent', 'node' ],
        [ 'Axis', 'self', 'node' ] ] ],
    xpath.parse(s, astFactory));
  test.done();
};
exports.testParseWildcard = function(test) {
  var s = new xpath.Stream('*/self::*/@*');
  test.deepEqual(
    [ 'PathExpr',
      [ '/',
        [ '/',
          [ 'Axis', 'child', 'element', '*' ],
          [ 'Axis', 'self', 'element', '*' ] ],
        [ 'Axis', 'attribute', 'attribute', '*' ] ] ],
    xpath.parse(s, astFactory));
  test.done();
};
exports.testParseFilter = function(test) {
  // tests FilterExpr, which is Primary followed by predicates.
  // Not to be confused with Step, which is node test followed by predicate.
  var s = new xpath.Stream('1[2][3]');
  test.deepEqual(['Predicate', ['Predicate', 1, 2], 3],
                 xpath.parse(s, astFactory));
  test.done();
};
exports.testParseStepWithPredicate = function(test) {
  // tests  Step, which is node test followed by predicate.
  // Not to be confused with FilterExpr, which is Primary followed by predicates.
  var s = new xpath.Stream('a[2][3]');
  test.deepEqual(['PathExpr',
                   ['Predicate',
                     ['Predicate',
                       ['Axis', 'child', 'element', 'a'],
                       2],
                     3]],
                 xpath.parse(s, astFactory));
  test.done();
};
exports.testParsePathWithPredicate = function(test) {
  // tests  Step, which is node test followed by predicate.
  // Not to be confused with FilterExpr, which is Primary followed by predicates.
  var s = new xpath.Stream('a/b[1]');
  test.deepEqual(['PathExpr', [ '/',
                  [ 'Axis', 'child', 'element', 'a' ],
                  [ 'Predicate', [ 'Axis', 'child', 'element', 'b' ], 1 ] ]],
                 xpath.parse(s, astFactory));
  test.done();
};
exports.testParseAbsoluteLocationPath = function(test) {
  var s = new xpath.Stream('/a/b/c');
  test.deepEqual(
      ['PathExpr',
        [ '/',
          [ '/',
            [ '/',
              [ 'Root' ],
              ['Axis', 'child', 'element', 'a' ] ],
            [ 'Axis', 'child', 'element', 'b' ] ],
          [ 'Axis', 'child', 'element', 'c' ] ] ],
      xpath.parse(s, astFactory));
  test.done();
};
exports.testParseRelativeLocationPath = function(test) {
  var s = new xpath.Stream('a/b/c');
  test.deepEqual(
      ['PathExpr',
        [ '/',
          [ '/',
            [ 'Axis', 'child', 'element', 'a' ],
            [ 'Axis', 'child', 'element', 'b' ] ],
          [ 'Axis', 'child', 'element', 'c' ] ] ],
      xpath.parse(s, astFactory));
  test.done();
};
exports.testParseNodeTest = function(test) {
  var s = new xpath.Stream('self::node()');
  test.deepEqual(['PathExpr', ['Axis', 'self', 'node', undefined]],
                 xpath.parse(s, astFactory));
  test.done();
};
exports.testParseAbsoluteShorthand = function(test) {
  var s2 = new xpath.Stream('/descendant-or-self::node()/a');
  var s1 = new xpath.Stream('//a');
  test.deepEqual(xpath.parse(s2, astFactory), xpath.parse(s1, astFactory));
  test.done();
};
exports.testParseLocationShorthand = function(test) {
  var s1 = new xpath.Stream('a//b');
  var s2 = new xpath.Stream('a/descendant-or-self::node()/b');
  test.deepEqual(xpath.parse(s2, astFactory), xpath.parse(s1, astFactory));
  test.done();
};
exports.testParseRoot = function(test) {
  var s = new xpath.Stream('/');
  test.deepEqual(['PathExpr', ['Root']], xpath.parse(s, astFactory));
  test.done();
};

exports.testEvaluateNumber = function(test) {
  var x = xpath.evaluateImpl('3', null, 'CTX');
  test.deepEqual(3, x);
  test.done();
};
exports.testEvaluateExtraParens = function(test) {
  var x = xpath.evaluateImpl('(((3)))', null, 'CTX');
  test.deepEqual(3, x);
  test.done();
};
exports.testEvaluateNumberFunction = function(test) {
  var x = xpath.evaluateImpl('number("3")', null, 'CTX');
  test.equal(3, x);
  test.done();
};
exports.testEvaluateUnaryMinus = function(test) {
  var x = xpath.evaluateImpl('-3', null, 'CTX');
  test.deepEqual(-3, x);
  test.done();
};
exports.testEvaluateUnaryMinusCoerced = function(test) {
  var x = xpath.evaluateImpl('--"3"', null, 'CTX');
  test.deepEqual(3, x);
  test.done();
};
exports.testEvaluateArithmetic = function(test) {
  var x = xpath.evaluateImpl('(2*11 + 5)mod 10', null, 'CTX');
  test.deepEqual(7, x);
  test.done();
};
exports.testEvaluateArithmetic2 = function(test) {
  var x = xpath.evaluateImpl(
    '1>.5 and 1>=.5 and (2=6div 3) and false()<.5 and true()>.5', null, 'CTX');
  test.deepEqual(true, x);
  test.done();
};
exports.testEvaluateWildcardChild = function(test) {
  var doc = jsdom.jsdom('<html><body><div>3</div><div>4</div></body></html>'),
      body = doc.getElementsByTagName('body')[0],
      div0 = doc.getElementsByTagName('div')[0],
      div1 = doc.getElementsByTagName('div')[1];
  var x = xpath.evaluateImpl('*', doc, body);
  test.deepEqual(xpath.stringifyObject({nodes:[div0,div1], pos: [[1],[2]], lasts: [[2],[2]]}), xpath.stringifyObject(x));
  test.done();
};
exports.testEvaluateArithmetic3 = function(test) {
  var doc = jsdom.jsdom('<html><body><div>3</div><div>4</div></body></html>'),
      body = doc.getElementsByTagName('body')[0];
  var x = xpath.evaluateImpl(
    '*<*', doc, body);
  test.deepEqual(true, x);
  test.done();
};
exports.testEvaluateRoot = function(test) {
  var doc = jsdom.jsdom('Hello.');
  var x = xpath.evaluateImpl('/', doc, doc);
  test.deepEqual(xpath.stringifyObject({nodes:[doc]}), xpath.stringifyObject(x));
  test.done();
};
exports.testEvaluateSelf = function(test) {
  var doc = jsdom.jsdom('<html><body><div>a<div>b</div></div></body></html>'),
      div0 = doc.getElementsByTagName('div')[0],
      div1 = doc.getElementsByTagName('div')[1];
  var newCtx = xpath.axes.self([doc, div0, div1], xpath.nodeTypes.element, null, true);
  test.deepEqual(
    xpath.stringifyObject(
      {nodes: [div0, div1],
       pos: [[1], [1]],
       lasts: [[1],[1]]}),
    xpath.stringifyObject(newCtx));
  test.done();
};
exports.testEvaluateParent = function(test) {
  var doc = jsdom.jsdom('<html><body><div>a<div>b</div></div><span></span></body></html>'),
      div0 = doc.getElementsByTagName('div')[0],
      span = doc.getElementsByTagName('span')[0],
      body = div0.parentNode;
  var newCtx = xpath.axes.parent([doc, div0, span], xpath.nodeTypes.element, null, true);
  test.deepEqual(
    xpath.stringifyObject(
      {nodes: [body],
       pos: [[1]],
       lasts: [[1]]}),
    xpath.stringifyObject(newCtx));
  test.done();
};
exports.testSortUniqDocumentOrder = function(test) {
  var doc = jsdom.jsdom('<html><body><div id=x><a></a><div>b</div></div><span></span></body></html>'),
      body = doc.getElementsByTagName('body')[0],
      div0 = doc.getElementsByTagName('div')[0],
      id = doc.getElementById('x').getAttributeNode('id'),
      a = doc.getElementsByTagName('a')[0],
      span = doc.getElementsByTagName('span')[0];
  var ctx = {nodes: [id, body, span, div0, a, span]};
  var ctx2 = {nodes: xpath.sortUniqDocumentOrder(ctx.nodes)};
  test.deepEqual(
    xpath.stringifyObject(
      {nodes: [body, div0, id, a, span]}),
    xpath.stringifyObject(ctx2));
  test.done();
};
exports.testId = function(test) {
  var doc = jsdom.jsdom(
    '<html><body><div id=test>b c d</div><br id=b><br id=c><br id=d></body></html>'),
      b = doc.getElementById('b'),
      c = doc.getElementById('c'),
      d = doc.getElementById('d');
  test.deepEqual(
    xpath.stringifyObject(
      {nodes: [b,c,d]}),
    xpath.stringifyObject(
      xpath.evaluateImpl('id(id("test"))', doc, doc)));
  test.done();
};
function outerHtml(node) { return node.outerHTML; }
exports.testEvaluateChildAxis = function(test) {
  var doc = jsdom.jsdom('<html><body>Hello.</body></html>');
  var ctx = doc.body;
  var x = xpath.evaluateImpl('child::text()', doc, ctx);
  test.deepEqual([doc.body.firstChild], x.nodes);
  test.done();
};
exports.testDescendantDfs1 = function(test) {
  var doc = jsdom.jsdom('<html><body><a><b><i></i></b></a><u></u></body></html>');
  var body = doc.getElementsByTagName('body')[0],
      a = doc.getElementsByTagName('a')[0],
      b = doc.getElementsByTagName('b')[0],
      i = doc.getElementsByTagName('i')[0],
      u = doc.getElementsByTagName('u')[0];
  var newCtx = xpath.axes.descendant([body], xpath.nodeTypes.element, null, true).simplify();
  test.deepEqual(
    xpath.stringifyObject(
      {nodes: [a, b, i, u],
       pos:[[1],[2],[3],[4]],lasts:[[4],[4],[4],[4]]}),
    xpath.stringifyObject(newCtx));
  test.done();
};
exports.testDescendantOrSelfChild = function(test) {
  // from http://trac.webkit.org/export/73247/trunk/LayoutTests/fast/xpath/xpath-functional-test.html
  var doc = jsdom.jsdom(
    '<html><body>' +
    '<blockquote id="n12" title="12" class="15">' + 
    '  <!--blockquoteComment-->' + 
    '  blockquoteText1:' + 
    '  <br id="n13" title="13" class="10">' + 
    '  blockquoteText2' + 
    '  <p id="n14" title="14" class="13">' + 
    '    <del id="n15" title="15" class="11">del</del>' + 
    '    <ins id="n16" title="16" class="12">ins</ins>' + 
    '  </p>' + 
    '  <!--?pi name="value"?-->' + 
    '  <font id="n17" title="17" class="14" face="n8 n26">font</font>' + 
    '</blockquote>' +
    '</html></body>'
  );
  var newCtx = xpath.evaluateImpl('.//*[ancestor::blockquote]', doc, doc);
  var nodeNames = newCtx.nodes
    .map(function(n) {return n.nodeName;})
    .join(' ').toLowerCase();
  test.deepEqual('br p del ins font', nodeNames);
  test.done();
};

function testDescendantDfsAndSelfBase(test, andSelf) {
  var andSelf = !!andSelf;
  var doc = jsdom.jsdom('<html><body><div>a<div>b</div></div></body></html>');
  var div0 = doc.getElementsByTagName('div')[0],
      div1 = doc.getElementsByTagName('div')[1];
  if (andSelf) fn = xpath.axes['descendant-or-self'];
  else fn = xpath.axes.descendant;
  var newCtx = fn([div0], xpath.nodeTypes.element, 'div', true).simplify();
  var expectedNodes = andSelf ? [div0, div1] : [div1];
  var expectedPos = andSelf ? [[1], [2]] : [[1]];
  var expectedLasts = andSelf ? [[2], [2]] : [[1]];
  test.deepEqual(
    xpath.stringifyObject(
      {nodes: expectedNodes, pos: expectedPos, lasts: expectedLasts}),
    xpath.stringifyObject(newCtx));
  test.done();
};
exports.testDescendantDfs = function(test) {
  testDescendantDfsAndSelfBase(test, false);
};
exports.testDescendantDfsAndSelf = function(test) {
  testDescendantDfsAndSelfBase(test, true);
};
exports.testDescendantDfsMultipleRoots = function(test) {
  var doc = jsdom.jsdom('<html><body><div>a<div>b</div></div></body></html>');
  var html = doc.getElementsByTagName('html')[0],
      body = doc.getElementsByTagName('body')[0],
      div0 = doc.getElementsByTagName('div')[0],
      div1 = doc.getElementsByTagName('div')[1];
  var newCtx = xpath.axes.descendant([html, div0], xpath.nodeTypes.element, null, true).simplify();
  test.deepEqual(
    xpath.stringifyObject(
      {nodes: [body, div0, div1], pos: [[1], [2], [3, 1]],
               lasts: [[3], [3], [3, 1]]}),
    xpath.stringifyObject(newCtx));
  test.done();
};
exports.testFollowing = function(test) {
  var doc = jsdom.jsdom(
    '<html><head><title></title></head>' +
    '<body>' +
      '<div><a></a><b></b></div>' +
      '<div><i></i><u></u></div>' +
    '</body></html>');
  var body = doc.getElementsByTagName('body')[0],
      div0 = doc.getElementsByTagName('div')[0],
      a = doc.getElementsByTagName('a')[0],
      b = doc.getElementsByTagName('b')[0],
      div1 = doc.getElementsByTagName('div')[1],
      i = doc.getElementsByTagName('i')[0],
      u = doc.getElementsByTagName('u')[0];
  var newCtx = xpath.axes.following([body, div0, a], xpath.nodeTypes.element, null, true).simplify();
  test.deepEqual(
    xpath.stringifyObject(
      { nodes: 
        [ b, div1, i, u ],
        pos: [ [ 1 ], [ 2, 1 ], [ 3, 2 ], [ 4, 3 ] ],
        lasts: [ [ 4 ], [ 4, 3 ], [ 4, 3 ], [ 4, 3 ] ] }),
    xpath.stringifyObject(newCtx));
  test.done();
};
exports.testPreceding = function(test) {
  var doc = jsdom.jsdom('<html><body><div>a<div>b</div></div><img></body></html>');
  var html = doc.getElementsByTagName('html')[0],
      body = doc.getElementsByTagName('body')[0],
      div0 = doc.getElementsByTagName('div')[0],
      div1 = doc.getElementsByTagName('div')[1],
      img = doc.getElementsByTagName('img')[0];
  var newCtx = xpath.axes.preceding([img], xpath.nodeTypes.element, null, true);
  test.deepEqual(
    xpath.stringifyObject(
      {nodes: [div0,div1], pos: [[2], [1]], lasts:[[2],[2]] }),
    xpath.stringifyObject(newCtx));
  test.done();
};
exports.testPreceding2 = function(test) {
  var doc = jsdom.jsdom(
    '<html><head><title></title></head>' +
    '<body>' +
      '<div><a></a><b></b></div>' +
      '<div><i></i><u></u></div>' +
    '</body></html>');
  var head = doc.getElementsByTagName('head')[0],
      title = doc.getElementsByTagName('title')[0],
      a = doc.getElementsByTagName('a')[0],
      b = doc.getElementsByTagName('b')[0],
      i = doc.getElementsByTagName('i')[0],
      u = doc.getElementsByTagName('u')[0],
      div0 = doc.getElementsByTagName('div')[0],
      div1 = doc.getElementsByTagName('div')[1];
  var newCtx = xpath.axes.preceding([b, i], xpath.nodeTypes.element, null, true);
  test.deepEqual(
    xpath.stringifyObject(
      {nodes: [head, title, div0, a, b],
       pos: [ [ 5, 3 ], [ 4, 2 ], [ 3 ], [ 2, 1 ], [ 1 ] ],
       lasts: [[5, 3], [5, 3], [5], [5, 3], [5]]}),
    xpath.stringifyObject(newCtx));
  test.done();
};
exports.testFollowingSibling = function(test) {
  var doc = jsdom.jsdom('<html><body><a>one</a><a>two</a><a>three</a><a>four</a><a>five</a><a>six</a></body></html>');
  var one = doc.getElementsByTagName('a')[0],
      two = doc.getElementsByTagName('a')[1],
      three = doc.getElementsByTagName('a')[2],
      four = doc.getElementsByTagName('a')[3],
      five = doc.getElementsByTagName('a')[4],
      six = doc.getElementsByTagName('a')[5];
  var newCtx = xpath.evaluateImpl('a[3]/following-sibling::*', doc, doc.body);
  test.deepEqual(
    xpath.stringifyObject({nodes:[four,five,six]}),
    xpath.stringifyObject(newCtx));
  test.done();
};
exports.testPrecedingSibling = function(test) {
  var doc = jsdom.jsdom('<html><body><a>one</a><a>two</a><a>three</a><a>four</a><a>five</a><a>six</a></body></html>');
  var one = doc.getElementsByTagName('a')[0],
      two = doc.getElementsByTagName('a')[1],
      three = doc.getElementsByTagName('a')[2],
      four = doc.getElementsByTagName('a')[3],
      five = doc.getElementsByTagName('a')[4],
      six = doc.getElementsByTagName('a')[5];
  var newCtx = xpath.evaluateImpl('a[3]/preceding-sibling::*', doc, doc.body);
  test.deepEqual(
    xpath.stringifyObject({nodes:[one,two]}),
    xpath.stringifyObject(newCtx));
  test.done();
};
exports.testAncestor = function(test) {
  var doc = jsdom.jsdom('<html><body><div>a<div>b</div></div><img></body></html>');
  var html = doc.getElementsByTagName('html')[0],
      body = doc.getElementsByTagName('body')[0],
      div0 = doc.getElementsByTagName('div')[0],
      div1 = doc.getElementsByTagName('div')[1],
      img = doc.getElementsByTagName('img')[0];
  var newCtx = xpath.axes.ancestor([div1, img], xpath.nodeTypes.element, null, true);
  test.deepEqual(
    xpath.stringifyObject(
      {nodes: [html, body, div0],
       pos:   [ [ 3, 2 ], [ 2, 1 ], [ 1 ] ],
       lasts: [ [ 3, 2 ], [ 3, 2 ], [ 3 ] ]}),
    xpath.stringifyObject(newCtx));
  test.done();
};
exports.testChild = function(test) {
  var doc = jsdom.jsdom('<html><body><div>a<div>b</div></div><img></body></html>');
  var html = doc.getElementsByTagName('html')[0],
      body = doc.getElementsByTagName('body')[0],
      div0 = doc.getElementsByTagName('div')[0],
      div1 = doc.getElementsByTagName('div')[1],
      img = doc.getElementsByTagName('img')[0];
  var newCtx = xpath.axes.child([body], xpath.nodeTypes.element, null, true);
  test.deepEqual(
    xpath.stringifyObject(
      {nodes: [div0, img], pos: [[1], [2]], lasts: [[2],[2]] }),
    xpath.stringifyObject(newCtx));
  test.done();
}

// TODO: 'concat(a[1], a[1][1])'
// TODO: 'concat(a[1], a[position()>1][1])'
exports.testEvaluatePosition = function(test) {
  var doc = jsdom.jsdom('<html><body><a>one</a><a>two</a><a>three</a></body></html>');
  var x = xpath.evaluateImpl('concat(a[1], a[1][1])', doc, doc.body);
  test.deepEqual('oneone', x);
  test.done();
};
exports.testEvaluatePositionAndLast = function(test) {
  var doc = jsdom.jsdom('<html><body><a>one</a><a>two</a><a>three</a><a>four</a><a>five</a><a>six</a></body></html>');
  var one = doc.getElementsByTagName('a')[0],
      two = doc.getElementsByTagName('a')[1],
      three = doc.getElementsByTagName('a')[2],
      four = doc.getElementsByTagName('a')[3],
      five = doc.getElementsByTagName('a')[4],
      six = doc.getElementsByTagName('a')[5];
  var newCtx = xpath.evaluateImpl('//a[last() mod position()=0]', doc, doc.body);
  test.deepEqual(
    xpath.stringifyObject({nodes:[one,two,three,six]}),
    xpath.stringifyObject(newCtx));
  test.done();
};
exports.testAttributePredicate = function(test) {
  var doc = jsdom.jsdom('<html><body><a href="x" rel=alternate>a</a></body></html>');
  var a = doc.getElementsByTagName('a')[0];
  var newCtx = xpath.evaluateImpl('//*[@href="x"]', doc, doc.body);
  test.deepEqual(
    xpath.stringifyObject({nodes:[a]}),
    xpath.stringifyObject(newCtx));
  test.done();
};
exports.testMorePredicates = function(test) {
  var doc = jsdom.jsdom('<html><body><blockquote><a></a></blockquote></body></html>');
  var blockquote = doc.getElementsByTagName('blockquote')[0],
      a = doc.getElementsByTagName('a')[0];
  var newCtx = xpath.evaluateImpl('//*[ancestor::blockquote]', doc, doc.body);
  test.deepEqual(
    xpath.stringifyObject({nodes:[a]}),
    xpath.stringifyObject(newCtx));
  test.done();
};
exports.testAttributeWildcard = function(test) {
  var doc = jsdom.jsdom('<html><body><a href="x" rel=alternate>a</a></body></html>');
  var a = doc.getElementsByTagName('a')[0];
  var newCtx = xpath.evaluateImpl('//*[@*="alternate"]', doc, doc.body);
  test.deepEqual(
    xpath.stringifyObject({nodes:[a]}),
    xpath.stringifyObject(newCtx));
  test.done();
};
exports.testEvaluatePath = function(test) {
  var doc = jsdom.jsdom('<html><body><div>a<div>b</div></div><img></body></html>');
  var html = doc.getElementsByTagName('html')[0],
      body = doc.getElementsByTagName('body')[0],
      div0 = doc.getElementsByTagName('div')[0],
      div1 = doc.getElementsByTagName('div')[1],
      img = doc.getElementsByTagName('img')[0];
  var newCtx = xpath.evaluateImpl('div/div', doc, doc.body);
  test.deepEqual(
    xpath.stringifyObject(
      {nodes: [div1], pos: [[1]], lasts: [[1]]}),
    xpath.stringifyObject(newCtx));
  test.done();
};
exports.testEvaluateName = function(test) {
  var doc = jsdom.jsdom('<html><head></head><body></body></html>');
  test.equal('body', xpath.evaluateImpl('name()', doc, doc.body));
  test.equal('body', xpath.evaluateImpl('local-name()', doc, doc.body));
  test.done();
};
exports.testEvaluateSubstringBefore = function(test) {
  var doc = jsdom.jsdom('<html></html>');
  var newCtx = xpath.evaluateImpl('substring-before("1999/04/01","/")', doc, doc.body);
  test.equal('1999', newCtx);
  test.done();
};
exports.testEvaluateSubstringAfter = function(test) {
  var doc = jsdom.jsdom('<html></html>');
  var newCtx = xpath.evaluateImpl('substring-after("1999/04/01","/")', doc, doc.body);
  test.deepEqual('04/01', newCtx);
  test.done();
};
exports.testEvaluateSubstring = function(test) {
  var doc = jsdom.jsdom('<html></html>');
  test.equal('04', xpath.evaluateImpl('substring("1999/04/01", 6, 2)', doc, doc));
  test.equal('04/01', xpath.evaluateImpl('substring("1999/04/01", 6)', doc, doc));
  test.done();
};
exports.testEvaluateContains = function(test) {
  var doc = jsdom.jsdom('<html></html>');
  test.equal(true, xpath.evaluateImpl('contains("hello", "el")', doc, doc));
  test.equal(false, xpath.evaluateImpl('contains("hello", "mm")', doc, doc));
  test.done();
};
exports.testEvaluateTranslate = function(test) {
  var doc = jsdom.jsdom('<html></html>');
  test.equal('BAr', xpath.evaluateImpl('translate("bar","abc","ABC")', doc, doc));
  test.equal('AAA', xpath.evaluateImpl('translate("--aaa--", "abc-", "ABC")', doc, doc));
  test.equal('sub', xpath.evaluateImpl('translate(normalize-space(" s u b"), " ", "")', doc, doc));
  test.done();
};
exports.testUnion = function(test) {
  var doc = jsdom.jsdom('<html><body><div>a<div>b</div></div><img></body></html>');
  var html = doc.getElementsByTagName('html')[0],
      body = doc.getElementsByTagName('body')[0],
      div0 = doc.getElementsByTagName('div')[0],
      div1 = doc.getElementsByTagName('div')[1],
      img = doc.getElementsByTagName('img')[0];
  var newCtx = xpath.evaluateImpl('img|div/div', doc, doc.body);
  test.deepEqual(
    xpath.stringifyObject(
      {nodes: [div1, img]}),
    xpath.stringifyObject(newCtx));
  test.done();
};
exports.testUnion2 = function(test) {
  var doc = jsdom.jsdom('<html><body><div>a<div>b</div></div><img></body></html>');
  var html = doc.getElementsByTagName('html')[0],
      body = doc.getElementsByTagName('body')[0],
      div0 = doc.getElementsByTagName('div')[0],
      div1 = doc.getElementsByTagName('div')[1],
      img = doc.getElementsByTagName('img')[0];
  var newCtx = xpath.evaluateImpl('div|zz', doc, doc.body);
  test.deepEqual(
    xpath.stringifyObject(
      {nodes: [div0]}),
    xpath.stringifyObject(newCtx));
  test.done();
};
exports.testUnion3 = function(test) {
  var doc = jsdom.jsdom('<html><body><div>a<div>b</div></div><img></body></html>');
  var html = doc.getElementsByTagName('html')[0],
      body = doc.getElementsByTagName('body')[0],
      div0 = doc.getElementsByTagName('div')[0],
      div1 = doc.getElementsByTagName('div')[1],
      img = doc.getElementsByTagName('img')[0];
  var newCtx = xpath.evaluateImpl('zz|div', doc, doc.body);
  test.deepEqual(
    xpath.stringifyObject(
      {nodes: [div0]}),
    xpath.stringifyObject(newCtx));
  test.done();
};
exports.testAttributesHaveNoChildren = function(test) {
  var doc = jsdom.jsdom('<html><body><a></a><b id=hi>btext</b><i></i></body></html>');
  var a = doc.getElementsByTagName('a')[0],
      b = doc.getElementsByTagName('b')[0],
      btext = b.firstChild,
      attr = b.getAttributeNode('id'),
      i = doc.getElementsByTagName('i')[0];
  test.deepEqual(
    xpath.stringifyObject({nodes: [b], pos: [[1]], lasts: [[1]]}),
    xpath.stringifyObject(xpath.evaluateImpl('parent::node()', doc, attr)));
  test.deepEqual(
    xpath.stringifyObject({nodes: [attr], pos: [[1]], lasts: [[1]]}),
    xpath.stringifyObject(xpath.evaluateImpl('self::node()', doc, attr)));
  test.deepEqual(
    xpath.stringifyObject({nodes: [], pos: [], lasts: []}),
    xpath.stringifyObject(xpath.evaluateImpl('child::node()', doc, attr)));
  test.deepEqual(
    xpath.stringifyObject({nodes: []}),
    xpath.stringifyObject(xpath.evaluateImpl('descendant::node()', doc, attr)));
  test.deepEqual(
    xpath.stringifyObject({nodes: [attr]}),
    xpath.stringifyObject(xpath.evaluateImpl('descendant-or-self::node()', doc, attr)));
  // Note: following DOES include the children of the element that the
  // attribute belongs to.
  test.deepEqual(
    xpath.stringifyObject({nodes: [btext, i]}),
    xpath.stringifyObject(xpath.evaluateImpl('following::node()', doc, attr)));
  test.deepEqual(
    xpath.stringifyObject({nodes: []}),
    xpath.stringifyObject(xpath.evaluateImpl('following-sibling::node()', doc, attr)));
  test.deepEqual(
    xpath.stringifyObject({nodes: [a], pos: [[1]], lasts: [[1]]}),
    xpath.stringifyObject(xpath.evaluateImpl('preceding::node()', doc, attr)));
  test.deepEqual(
    xpath.stringifyObject({nodes: []}),
    xpath.stringifyObject(xpath.evaluateImpl('preceding-sibling::node()', doc, attr)));
  test.done();
};
function stringifyNodeList(l) {
  var r = [];
  for (var i = 0; i < l.length; ++i) {
    r.push(l[i].outerHTML);
  }
  return r;
}
exports.testDocumentEvaluate = function(test) {
  var doc = jsdom.jsdom('<html><body><div>a<div>b</div></div><img></body></html>');
  var html = doc.getElementsByTagName('html')[0],
      body = doc.getElementsByTagName('body')[0],
      div0 = doc.getElementsByTagName('div')[0],
      div1 = doc.getElementsByTagName('div')[1],
      img = doc.getElementsByTagName('img')[0];
  var res = doc.evaluate('img', doc.body, null, 0, null);
  var r = [], x;
  while (x = res.iterateNext())
    r.push(x);
  test.deepEqual(
    stringifyNodeList([img]),
    stringifyNodeList(r));
  test.done();
};
exports.testDocumentEvaluate2 = function(test) {
  var doc = jsdom.jsdom('<html><body><div>a<div>b</div></div><img></body></html>');
  var html = doc.getElementsByTagName('html')[0],
      body = doc.getElementsByTagName('body')[0],
      div0 = doc.getElementsByTagName('div')[0],
      div1 = doc.getElementsByTagName('div')[1],
      img = doc.getElementsByTagName('img')[0];
  var res = doc.evaluate('//div', doc, null, 0, null);
  var r = [], x;
  while (x = res.iterateNext())
    r.push(x);
  test.deepEqual(
    stringifyNodeList([div0, div1]),
    stringifyNodeList(r));
  test.done();
};
exports.testDocumentEvaluateWildcard = function(test) {
  var doc = jsdom.jsdom('<html><body><div>a<div>b</div></div><img></body></html>');
  var html = doc.getElementsByTagName('html')[0],
      body = doc.getElementsByTagName('body')[0],
      div0 = doc.getElementsByTagName('div')[0],
      div1 = doc.getElementsByTagName('div')[1],
      img = doc.getElementsByTagName('img')[0];
  var res = doc.evaluate('//div/*', doc, null, 0, null);
  var r = [], x;
  while (x = res.iterateNext())
    r.push(x);
  test.deepEqual(
    stringifyNodeList([div1]),
    stringifyNodeList(r));
  test.done();
};
exports.testDocumentEvaluateStringPred = function(test) {
  var doc = jsdom.jsdom('<html><body><div>a<div>b</div></div><img></body></html>');
  var html = doc.getElementsByTagName('html')[0],
      body = doc.getElementsByTagName('body')[0],
      div0 = doc.getElementsByTagName('div')[0],
      div1 = doc.getElementsByTagName('div')[1],
      img = doc.getElementsByTagName('img')[0];
  var res = doc.evaluate('//div[1]', doc, null, 0, null);
  var r = [], x;
  while (x = res.iterateNext())
    r.push(x);
  test.deepEqual(
    stringifyNodeList([div0, div1]),
    stringifyNodeList(r));
  test.done();
};
exports.testAttributeNodePredicate = function(test) {
  // copied from Webkit LayoutTests/fast/xpath/attribute-node-predicate.html
  var doc = jsdom.jsdom('<html></html>');
  var root = doc.createElement('div');
  root.innerHTML =
    '<p>a</p><div><span id="21"></span><span id="22"></span><span id="23"></span></div>';
  var child1 = root.firstChild,
      child1text = child1.firstChild,
      child2 = root.lastChild,
      child21 = child2.firstChild,
      child22 = child21.nextSibling,
      child23 = child22.nextSibling;
  var result = xpath.evaluateImpl(".//@id[false]", doc, root);
  test.deepEqual(xpath.stringifyObject({nodes:[]}), xpath.stringifyObject(result));
  result = xpath.evaluateImpl(".//@id[1]/parent::*", doc, root);
  test.deepEqual(
    xpath.stringifyObject({nodes:[child21, child22, child23],
                      pos: [ [ 1 ], [ 1 ], [ 1 ] ],
                      lasts: [ [ 1 ], [ 1 ], [ 1 ] ]}),
    xpath.stringifyObject(result));
  result = xpath.evaluateImpl(".//@id[2]/parent::*", doc, root);
  test.deepEqual(xpath.stringifyObject({nodes:[],pos:[],lasts:[]}), xpath.stringifyObject(result));
  result = xpath.evaluateImpl(".//@id[string()='21']/parent::*", doc, root);
  test.deepEqual(
    xpath.stringifyObject({nodes:[child21], pos:[[1]],lasts:[[1]]}),
    xpath.stringifyObject(result));
  result = xpath.evaluateImpl(".//@id[string()='22']/parent::*", doc, root);
  test.deepEqual(
    xpath.stringifyObject({nodes:[child22], pos:[[1]],lasts:[[1]]}),
    xpath.stringifyObject(result));
  test.done();
};


// The following test cases are taken from the NIST XSLT/XPath test suite.
// http://web.archive.org/web/20041019015748/http://xw2k.sdct.itl.nist.gov/xml/page5.html
// Only test cases applicable to XPath are included.

exports.tests.NIST_coreFunction001 = function() {
    var document = getImplementation().createDocument();
    assertEquals("correct substring", "correct substring",
            xpath.evaluateImpl("substring(substring('internalexternalcorrect substring',9),9)", document, document));
};

exports.tests.NIST_coreFunction002 = function() {
    var document = getImplementation().createDocument();
    assertEquals("correct substring", "correct substring",
            xpath.evaluateImpl("substring(substring('internalexternalcorrect substring',9,25),9,17)", document, document));
};

exports.tests.NIST_coreFunction003 = function() {
    var document = getImplementation().createDocument();
    assertEquals("concatenated string", "A New Concatenated String",
            xpath.evaluateImpl("concat(concat('A ','N','e'),'w ','Concatenated String')", document, document));
};

exports.tests.NIST_coreFunction004 = function() {
    var document = getImplementation().createDocument();
    assertEquals("unchanged string", "Unchanged String",
            xpath.evaluateImpl("string(string('Unchanged String'))", document, document));
};

exports.tests.NIST_coreFunction005 = function() {
    var document = getImplementation().createDocument();
    assertEquals("correct substring after", "Correct Substring After",
            xpath.evaluateImpl("substring-after(substring-after('wrongnogoodCorrect Substring After','wrong'),'nogood')", document, document));
};

exports.tests.NIST_coreFunction006 = function() {
    var document = getImplementation().createDocument();
    assertEquals("correct substring before", "correct substring Before",
            xpath.evaluateImpl("substring-before(substring-before('correct substring Beforenogoodwrong','wrong'),'nogood')", document, document));
};

exports.tests.NIST_coreFunction007 = function() {
    var document = getImplementation().createDocument();
    assertEquals("new string", "new string",
            xpath.evaluateImpl("translate(translate('old string','old','123'),'123','new')", document, document));
};

exports.tests.NIST_coreFunction008 = function() {
    var document = getImplementation().createDocument();
    assertEquals("new string", "new string",
            xpath.evaluateImpl("translate('old string',translate('123','123','old'),'new')", document, document));
};

exports.tests.NIST_coreFunction009 = function() {
    var document = getImplementation().createDocument();
    assertEquals("new string", "new string",
            xpath.evaluateImpl("translate(translate('old string','old string','old string'),translate('123','123','old'),translate('123','123','new'))", document, document));
};

exports.tests.NIST_coreFunction010 = function() {
    var document = getImplementation().createDocument();
    assertEquals("new string", "new string",
            xpath.evaluateImpl("translate(translate('old string','old string','old string'),translate('123','123','old'),translate('123','123','new'))", document, document));
};

exports.tests.NIST_coreFunction011 = function() {
    var document = getImplementation().createDocument();
    assertEquals("a new concatenated string", "A New Concatenated String",
            xpath.evaluateImpl("concat('A New ',concat('Conca','tena','ted '),'String')", document, document));
};

exports.tests.NIST_coreFunction012 = function() {
    var document = getImplementation().createDocument();
    assertEquals("a new concatenated string", "A New Concatenated String",
            xpath.evaluateImpl("concat('A New ','Concatenated ',concat('St','ri','ng'))", document, document));
};

exports.tests.NIST_coreFunction013 = function() {
    var document = getImplementation().createDocument();
    assertEquals("a new concatnated string", "A New Concatenated String",
            xpath.evaluateImpl("concat(concat('A ','Ne','w '),concat('Conca','tena','ted '),concat('St','ri','ng'))", document, document));
};

exports.tests.NIST_coreFunction014 = function() {
    var document = getImplementation().createDocument();
    assertEquals("correct substring after", "Correct Substring After",
            xpath.evaluateImpl("substring-after('wrongCorrect Substring After',substring-after('nogoodstringwrong','nogoodstring'))", document, document));
};

exports.tests.NIST_coreFunction015 = function() {
    var document = getImplementation().createDocument();
    assertEquals("correct substring after", "Correct Substring After",
            xpath.evaluateImpl("substring-after(substring-after('nogoodwrongCorrect Substring After','nogood'),substring-after('nogoodstringwrong','nogoodstring'))", document, document));
};

exports.tests.NIST_coreFunction016 = function() {
    var document = getImplementation().createDocument();
    assertEquals("correct substring before", "Correct Substring Before",
            xpath.evaluateImpl("substring-before('Correct Substring Beforewrong',substring-before('wrongnogood','nogood'))", document, document));
};

exports.tests.NIST_coreFunction017 = function() {
    var document = getImplementation().createDocument();
    assertEquals("correct substring before", "Correct Substring Before",
            xpath.evaluateImpl("substring-before(substring-before('Correct Substring Beforewrongcut here','cut here'),substring-before('wrongnogood','nogood'))", document, document));
};

// coreFunction018 thru coreFunction035 are omitted because they test XPath
// variables, but DOM 3 XPath does not provide any facility to set variables.
//
// The tests are reproduced here anyway in case in the future jsdom provides
// some non-standard mechanism for setting variables.
//
//
// exports.tests.NIST_coreFunction018 = function() {
//     var document = getImplementation().createDocument();
//     // set $variable1 = "String From Variable"
//     assertEquals("string from variable", "String From Variable",
//             xpath.evaluateImpl("string($variable1)", document, document));
// };
//
// exports.tests.NIST_coreFunction019 = function() {
//     var document = getImplementation().createDocument();
//     // set $variable1 = "String "
//     assertEquals("string from variable", "String From Variable",
//             xpath.evaluateImpl("concat($variable1,'From ','Variable')", document, document));
// };
// 
// exports.tests.NIST_coreFunction020 = function() {
//     var document = getImplementation().createDocument();
//     // set $variable1 = "From "
//     assertEquals("string from variable", "String From Variable",
//             xpath.evaluateImpl("concat('String ',$variable1,'Variable')", document, document));
// };
// 
// exports.tests.NIST_coreFunction021 = function() {
//     var document = getImplementation().createDocument();
//     // set $variable1 = "Variable"
//     assertEquals("string from variable", "String From Variable",
//             xpath.evaluateImpl("concat('String ','From ',$variable1)", document, document));
// };
// 
// exports.tests.NIST_coreFunction022 = function() {
//     var document = getImplementation().createDocument();
//     // set $variable1 = "String "
//     // set $variable2 = "From "
//     // set $variable3 = "Variable"
//     assertEquals("string from variable", "String From Variable",
//             xpath.evaluateImpl("concat($variable1,$variable2,$variable3)", document, document));
// };
// 
// exports.tests.NIST_coreFunction023 = function() {
//     var document = getImplementation().createDocument();
//     // set $variable1 = "substring-before with variablecut this"
//     assertEquals("substring-before with variable", "substring-before with variable",
//             xpath.evaluateImpl("substring-before($variable1,'cut this')", document, document));
// };
// 
// exports.tests.NIST_coreFunction024 = function() {
//     var document = getImplementation().createDocument();
//     // set $variable1 = "cut this"
//     assertEquals("substring-before with variable", "substring-before with variable",
//             xpath.evaluateImpl("substring-before('substring-before with variablecut this',$variable1)", document, document));
// };
// 
// exports.tests.NIST_coreFunction025 = function() {
//     var document = getImplementation().createDocument();
//     // set $variable1 = "substring before with variablecut this"
//     // set $variable2 = "cut this"
//     assertEquals("substring before with variable", "substring before with variable",
//             xpath.evaluateImpl("substring-before($variable1,$variable2)", document, document));
// };
// 
// exports.tests.NIST_coreFunction026 = function() {
//     var document = getImplementation().createDocument();
//     // set $variable1 = "cut thissubstring-after with variable"
//     assertEquals("substring-after with variable", "substring-after with variable",
//             xpath.evaluateImpl("substring-after($variable1,'cut this')", document, document));
// };
// 
// exports.tests.NIST_coreFunction027 = function() {
//     var document = getImplementation().createDocument();
//     // set $variable1 = "cut this"
//     assertEquals("substring after with variable", "substring after with variable",
//             xpath.evaluateImpl("substring-after('cut thissubstring after with variable',$variable1)", document, document));
// };
// 
// exports.tests.NIST_coreFunction028 = function() {
//     var document = getImplementation().createDocument();
//     // set $variable1 = "cut thissubstring-after with variable"
//     // set $variable2 = "cut this"
//     assertEquals("substring-after with variable", "substring-after with variable",
//             xpath.evaluateImpl("substring-after($variable1,$variable2)", document, document));
// };
// 
// exports.tests.NIST_coreFunction029 = function() {
//     var document = getImplementation().createDocument();
//     // set $variable1 = "cut thissubstring with variable"
//     assertEquals("substring with variable", "substring with variable",
//             xpath.evaluateImpl("substring($variable1,9)", document, document));
// };
// 
// exports.tests.NIST_coreFunction030 = function() {
//     var document = getImplementation().createDocument();
//     // set $variable1 = "cut thissubstring with variable"
//     assertEquals("substring with variable", "substring with variable",
//             xpath.evaluateImpl("substring($variable1,9,23)", document, document));
// };
// 
// exports.tests.NIST_coreFunction031 = function() {
//     var document = getImplementation().createDocument();
//     // set $variable1 = "should return the value 26"
//     assertEquals("length 26", 26,
//             xpath.evaluateImpl("string-length($variable1)", document, document));
// };
// 
// exports.tests.NIST_coreFunction032 = function() {
//     var document = getImplementation().createDocument();
//     // set $variable1 = "translate 1234 variable"
//     assertEquals("translate with variable", "translate with variable",
//             xpath.evaluateImpl("translate($variable1,'1234','with')", document, document));
// };
// 
// exports.tests.NIST_coreFunction033 = function() {
//     var document = getImplementation().createDocument();
//     // set $variable1 = "1234"
//     assertEquals("translate with variable", "translate with variable",
//             xpath.evaluateImpl("translate('translate 1234 variable',$variable1,'with')", document, document));
// };
// 
// exports.tests.NIST_coreFunction034 = function() {
//     var document = getImplementation().createDocument();
//     // set $variable1 = "with"
//     assertEquals("translate with variable", "translate with variable",
//             xpath.evaluateImpl("translate('translate 1234 variable','1234',$variable1)", document, document));
// };
// 
// exports.tests.NIST_coreFunction035 = function() {
//     var document = getImplementation().createDocument();
//     // set $variable1 = "translate 1234 variable"
//     // set $variable2 = "1234"
//     // set $variable3 = "with"
//     assertEquals("translate with variable", "translate with variable",
//             xpath.evaluateImpl("translate($variable1,$variable2,$variable3)", document, document));
// };


// coreFunction036 thru coreFunction059 are omitted since they test XSLT
// parameters. Outside the context of XSLT, they are effectively redundant
// with coreFunction018 thru coreFunction035.


exports.tests.NIST_coreFunction060 = function() {
    var document = getImplementation().createDocument();
    assertEquals("-2", -2,
            xpath.evaluateImpl("floor(-1.99999)", document, document));
};

exports.tests.NIST_coreFunction061 = function() {
    var document = getImplementation().createDocument();
    assertEquals("-2", -2,
            xpath.evaluateImpl("floor(-1.0001)", document, document));
};


// coreFunction062 is omitted because it tests XPath variables, as above.

// exports.tests.NIST_coreFunction062 = function() {
//     var document = getImplementation().createDocument();
//     // set $variable1 = "3.1"
//     assertEquals("3", 3,
//             xpath.evaluateImpl("floor($variable1)", document, document));
// };


// coreFunction063 is omitted because it tests XSLT parameters, as above.


exports.tests.NIST_coreFunction064 = function() {
    var document = getImplementation().createDocument();
    assertEquals("2", 2,
            xpath.evaluateImpl("floor(ceiling(1.2))", document, document));
};

exports.tests.NIST_coreFunction065 = function() {
    var document = getImplementation().createDocument();
    assertEquals("1", 1,
            xpath.evaluateImpl("floor(round(1.2))", document, document));
};

exports.tests.NIST_coreFunction066 = function() {
    var document = getImplementation().createDocument();
    assertEquals("1", 1,
            xpath.evaluateImpl("floor(floor(1.2))", document, document));
};

exports.tests.NIST_coreFunction067 = function() {
    var document = getImplementation().createDocument();
    assertEquals("1", 1,
            xpath.evaluateImpl("floor((((((2*10)-4)+9) div 5) mod 2))", document, document));
};

exports.tests.NIST_coreFunction068 = function() {
    var document = getImplementation().createDocument();
    assertEquals("-1", -1,
            xpath.evaluateImpl("ceiling(-1.0001)", document, document));
};

exports.tests.NIST_coreFunction069 = function() {
    var document = getImplementation().createDocument();
    assertEquals("-1", -1,
            xpath.evaluateImpl("ceiling(-1.9999)", document, document));
};

// coreFunction070 is omitted because it tests XPath variables, as above.
// 
// exports.tests.NIST_coreFunction070 = function() {
//     var document = getImplementation().createDocument();
//     // set $variable1 = "2.5"
//     assertEquals("3", 3,
//             xpath.evaluateImpl("ceiling($variable1)", document, document));
// };

exports.tests.NIST_coreFunction071 = function() {
    var document = getImplementation().createDocument();
    assertEquals("2", 2,
            xpath.evaluateImpl("ceiling(floor(2.2))", document, document));
};

exports.tests.NIST_coreFunction072 = function() {
    var document = getImplementation().createDocument();
    assertEquals("4", 4,
            xpath.evaluateImpl("ceiling(ceiling(3.2))", document, document));
};


// coreFunction073 is omitted because it tests XSLT parameters, as above.


exports.tests.NIST_coreFunction074 = function() {
    var document = getImplementation().createDocument();
    assertEquals("3", 3,
            xpath.evaluateImpl("ceiling((((((2*10)-4)+9) div 5) div 2))", document, document));
};

exports.tests.NIST_coreFunction075 = function() {
    var document = getImplementation().createDocument();
    assertEquals("-2", -2,
            xpath.evaluateImpl("round(-1.9999)", document, document));
};

// coreFunction076 is omitted because it tests XPath variables, as above.
// 
// exports.tests.NIST_coreFunction076 = function() {
//     var document = getImplementation().createDocument();
//     // set $variable1 = "2.3"
//     assertEquals("2", 2
//             xpath.evaluateImpl("round($variable1)", document, document));
// };


// coreFunction077 is omitted because it tests XSLT parameters, as above.


exports.tests.NIST_coreFunction078 = function() {
    var document = getImplementation().createDocument();
    assertEquals("4", 4,
            xpath.evaluateImpl("round(ceiling(3.2))", document, document));
};

exports.tests.NIST_coreFunction079 = function() {
    var document = getImplementation().createDocument();
    assertEquals("3", 3,
            xpath.evaluateImpl("round((((((2*10)-4)+9) div 5) div 2))", document, document));
};

exports.tests.NIST_coreFunction080 = function() {
    var document = getImplementation().createDocument();
    assertNaN("NaN", xpath.evaluateImpl("round(NaN)", document, document));
};

exports.tests.NIST_coreFunction081 = function() {
    var document = getImplementation().createDocument();
    assertEquals("0", 0,
            xpath.evaluateImpl("round(-0)", document, document));
};

exports.tests.NIST_coreFunction082 = function() {
    var document = getImplementation().createDocument();
    assertEquals("0", 0,
            xpath.evaluateImpl("round(-0.25)", document, document));
};

exports.tests.NIST_coreFunction083 = function() {
    var document = getImplementation().createDocument();
    assertEquals("2", 2,
            xpath.evaluateImpl("round(round(2.3))", document, document));
};

exports.tests.NIST_coreFunction084 = function() {
    var document = getImplementation().createDocument();
    assertEquals("infinity", Number.POSITIVE_INFINITY,
            xpath.evaluateImpl("round(2.3 div 0)", document, document));
};

exports.tests.NIST_coreFunction085 = function() {
    var document = getImplementation().createDocument();
    assertEquals("-infinity", Number.NEGATIVE_INFINITY,
            xpath.evaluateImpl("round(-2.3 div 0)", document, document));
};

exports.tests.NIST_coreFunction086 = function() {
    var document = getImplementation().createDocument();
    assertEquals("-1.9999", -1.9999,
            xpath.evaluateImpl("number('-1.9999')", document, document));
};

exports.tests.NIST_coreFunction087 = function() {
    var document = getImplementation().createDocument();
    assertEquals("1.9999", 1.9999,
            xpath.evaluateImpl("number('1.9999')", document, document));
};

exports.tests.NIST_coreFunction088 = function() {
    var document = getImplementation().createDocument();
    var doc = document.createElement("doc");
    document.appendChild(doc);
    var element1 = document.createElement("element1");
    doc.appendChild(element1);
    var child1 = document.createElement("child1");
    element1.appendChild(child1);
    var text = document.createTextNode("Test executed Successfully!!");
    child1.appendChild(text);
    var element2 = document.createElement("element2");
    doc.appendChild(element2);
    child1 = document.createElement("child1");
    text = document.createTextNode("Incorrect execution!!");
    child1.appendChild(text);
    
    assertEquals("1", 1,
            xpath.evaluateImpl("count(//child1[ancestor::element1])", document, doc));
};

exports.tests.NIST_coreFunction089 = function() {
    var document = getImplementation().createDocument();
    var doc = document.createElement("doc");
    document.appendChild(doc);
    var element1 = document.createElement("element1");
    doc.appendChild(element1);
    var text = document.createTextNode("Incorrect Execution!!");
    element1.appendChild(text);
    element1 = document.createElement("element1");
    doc.appendChild(element1);
    text = document.createTextNode("Test executed Successfully!!");
    element1.appendChild(text);
    
    assertArrayEquals("element1", [element1],
            xpath.evaluateImpl("element1[2]", document, doc).nodes);
};


// Many of the NIST dataManipulation tests include more than one XPath query,
// so here they're split into multiple test cases.
//
// Some dataManipulation tests test XSLT features that aren't part of XPath,
// so those tests are omitted here.

exports.tests.NIST_dataManipulation001a = function() {
    var document = getImplementation().createDocument();
    assertEquals("2 > 1", true,
            xpath.evaluateImpl("2 > 1", document, document));
};

exports.tests.NIST_dataManipulation001b = function() {
    var document = getImplementation().createDocument();
    assertEquals("9 mod 3 = 0", true,
            xpath.evaluateImpl("9 mod 3 = 0", document, document));
};

exports.tests.NIST_dataManipulation002a = function() {
    var document = getImplementation().createDocument();
    assertEquals("2 > 3 is false", false,
            xpath.evaluateImpl("2 > 3", document, document));
};

exports.tests.NIST_dataManipulation003 = function() {
    var document = getImplementation().createDocument();
    assertEquals("(((((2*10)-4)+9) div 5) div 2) > 2", true,
            xpath.evaluateImpl("(((((2*10)-4)+9) div 5) div 2) > 2", document, document));
};

exports.tests.NIST_dataManipulation004 = function() {
    var document = getImplementation().createDocument();
    assertEquals("(((((2*10)-4)+9) div 5) div 2) > 4 is false", false,
            xpath.evaluateImpl("(((((2*10)-4)+9) div 5) div 2) > 4", document, document));
};

exports.tests.NIST_dataManipulation007 = function() {
    var document = getImplementation().createDocument();
    assertEquals("(round(3.7) > 3)", true,
            xpath.evaluateImpl("(round(3.7) > 3)", document, document));
};

exports.tests.NIST_dataManipulation009 = function() {
    var document = getImplementation().createDocument();
    var doc = document.createElement("doc");
    document.appendChild(doc);
    var element1 = document.createElement("element1");
    doc.appendChild(element1);
    var text = document.createTextNode("Test executed successfully!!");
    element1.appendChild(text);
    var element2 = document.createElement("element2");
    text = document.createTextNode("Incorrect execution!!");
    element2.appendChild(text);
    
    assertArrayEquals("doc/element1", [element1],
            xpath.evaluateImpl("doc/element1", document, document).nodes);
};

exports.tests.NIST_dataManipulation013 = function() {
    var document = getImplementation().createDocument();
    var doc = document.createElement("doc");
    document.appendChild(doc);
    var element1 = document.createElement("element1");
    doc.appendChild(element1);
    var text = document.createTextNode("Incorrect execution!!");
    element1.appendChild(text);
    element1 = document.createElement("element1");
    doc.appendChild(element1);
    text = document.createTextNode("Incorrect execution!!");
    element1.appendChild(text);
    element1 = document.createElement("element1");
    doc.appendChild(element1);
    text = document.createTextNode("Test Executed Successfully!!");
    element1.appendChild(text);
    var element2 = document.createElement("element2");
    doc.appendChild(element2);
    text = document.createTextNode("Incorrect execution!!");
    element2.appendChild(text);
    
    assertArrayEquals("doc/element1[last()]", [element1],
            xpath.evaluateImpl("doc/element1[last()]", document, document).nodes);
};

exports.tests.NIST_dataManipulation014 = function() {
    var document = getImplementation().createDocument();
    var doc = document.createElement("doc");
    document.appendChild(doc);
    var element1 = document.createElement("element1");
    doc.appendChild(element1);
    var text = document.createTextNode("Incorrect execution!!");
    element1.appendChild(text);
    element1 = document.createElement("element1");
    doc.appendChild(element1);
    text = document.createTextNode("Incorrect execution!!");
    element1.appendChild(text);
    element1 = document.createElement("element1");
    doc.appendChild(element1);
    text = document.createTextNode("Test Executed Successfully!!");
    element1.appendChild(text);
    var element2 = document.createElement("element2");
    doc.appendChild(element2);
    text = document.createTextNode("Incorrect execution!!");
    element2.appendChild(text);
    
    assertArrayEquals("element1", [element1],
            xpath.evaluateImpl("doc/element1[((((((2*10)-4)+9) div 5) mod 3)+1)]", document, document).nodes);
};

exports.tests.NIST_dataManipulation016 = function() {
    var document = getImplementation().createDocument();
    var doc = document.createElement("doc");
    document.appendChild(doc);
    var element1 = document.createElement("element1");
    doc.appendChild(element1);
    var child1 = document.createElement("child1");
    element1.appendChild(child1);
    var text = document.createTextNode("Test Executed Successfully!!");
    child1.appendChild(text);
    var element2 = document.createElement("element2");
    doc.appendChild(element2);
    child1 = document.createElement("child1");
    element2.appendChild(child1);
    text = document.createTextNode("Incorrect Execution!!");
    child1.appendChild(text);
    
    assertArrayEquals("element1", [element1],
            xpath.evaluateImpl("//child1[ancestor::element1]", document, document).nodes);
};


exports.tests.NIST_expression001 = function() {
    var document = getImplementation().createDocument();
    var doc = document.createElement("doc");
    document.appendChild(doc);
    var sub1 = document.createElement("sub1");
    doc.appendChild(sub1);
    var child1 = document.createElement("child1");
    sub1.appendChild(child1);
    var text = document.createTextNode("child1");
    child1.appendChild(text);
    var sub2 = document.createElement("sub2");
    doc.appendChild(sub2);
    var child2 = document.createElement("child2");
    sub2.appendChild(child2);
    text = document.createTextNode("child2");
    child2.appendChild(text);
    
    assertArrayEquals("child1|child2", [child1,child2],
            xpath.evaluateImpl("/doc/sub1/child1|/doc/sub2/child2", document, doc).nodes);
};

exports.tests.NIST_expression002 = function() {
    var document = getImplementation().createDocument();
    var doc = document.createElement("doc");
    document.appendChild(doc);
    var sub1 = document.createElement("sub1");
    doc.appendChild(sub1);
    var child1 = document.createElement("child1");
    sub1.appendChild(child1);
    var text = document.createTextNode("child1");
    child1.appendChild(text);
    var sub2 = document.createElement("sub2");
    doc.appendChild(sub2);
    var child2 = document.createElement("child2");
    sub2.appendChild(child2);
    text = document.createTextNode("child2");
    child2.appendChild(text);
    
    assertArrayEquals("child1|child2", [child1,child2],
            xpath.evaluateImpl("sub1/child1|/doc/sub2/child2", document, doc).nodes);
};

exports.tests.NIST_expression003 = function() {
    var document = getImplementation().createDocument();
    var doc = document.createElement("doc");
    document.appendChild(doc);
    var sub1 = document.createElement("sub1");
    doc.appendChild(sub1);
    var child1 = document.createElement("child1");
    sub1.appendChild(child1);
    var text = document.createTextNode("descendant number 1");
    child1.appendChild(text);
    var sub2 = document.createElement("sub2");
    doc.appendChild(sub2);
    var child2 = document.createElement("child2");
    sub2.appendChild(child2);
    text = document.createTextNode("descendant number 2");
    child2.appendChild(text);
    
    assertArrayEquals("child1|child2", [child1,child2],
            xpath.evaluateImpl("//child1|//child2", document, doc).nodes);
    
    assertArrayEquals("sub1", [sub1],
            xpath.evaluateImpl("ancestor::sub1|ancestor::sub2", document, child1).nodes);
    
    assertArrayEquals("sub2", [sub2],
            xpath.evaluateImpl("ancestor::sub1|ancestor::sub2", document, child2).nodes);
};

exports.tests.NIST_expression004 = function() {
    var document = getImplementation().createDocument();
    var doc = document.createElement("doc");
    document.appendChild(doc);
    var sub1 = document.createElement("sub1");
    doc.appendChild(sub1);
    var child1 = document.createElement("child1");
    sub1.appendChild(child1);
    var text = document.createTextNode("descendant number 1");
    child1.appendChild(text);
    var sub2 = document.createElement("sub2");
    doc.appendChild(sub2);
    var child2 = document.createElement("child2");
    sub2.appendChild(child2);
    text = document.createTextNode("descendant number 2");
    child2.appendChild(text);
    
    assertArrayEquals("child1|child2", [child1,child2],
            xpath.evaluateImpl("//child1|//child2", document, doc).nodes);
    
    assertArrayEquals("sub1", [sub1],
            xpath.evaluateImpl("ancestor-or-self::sub1|ancestor-or-self::sub2", document, child1).nodes);
    
    assertArrayEquals("sub2", [sub2],
            xpath.evaluateImpl("ancestor-or-self::sub1|ancestor-or-self::sub2", document, child2).nodes);
};

exports.tests.NIST_expression005 = function() {
    var document = getImplementation().createDocument();
    var doc = document.createElement("doc");
    document.appendChild(doc);
    var book1 = document.createElement("book");
    doc.appendChild(book1);
    var author1 = document.createElement("author");
    book1.appendChild(author1);
    var name = document.createElement("name");
    author1.appendChild(name);
    name.setAttribute("real", "no");
    var text = document.createTextNode("Carmelo Montanez");
    name.appendChild(text);
    var chapters = document.createElement("chapters");
    author1.appendChild(chapters);
    text = document.createTextNode("Nine");
    chapters.appendChild(text);
    var bibliography = document.createElement("bibliography");
    author1.appendChild(bibliography);
    var book2 = document.createElement("book");
    doc.appendChild(book2);
    var author2 = document.createElement("author");
    book2.appendChild(author2);
    name = document.createElement("name");
    author2.appendChild(name);
    name.setAttribute("real", "na");
    text = document.createTextNode("David Marston");
    name.appendChild(text);
    chapters = document.createElement("chapters");
    author2.appendChild(chapters);
    text = document.createTextNode("Seven");
    chapters.appendChild(text);
    bibliography = document.createElement("bibliography");
    author2.appendChild(bibliography);
    var book3 = document.createElement("book");
    doc.appendChild(book3);
    var author3 = document.createElement("author");
    book3.appendChild(author3);
    name = document.createElement("name");
    author3.appendChild(name);
    name.setAttribute("real", "yes");
    text = document.createTextNode("Mary Brady");
    name.appendChild(text);
    chapters = document.createElement("chapters");
    author3.appendChild(chapters);
    text = document.createTextNode("Ten");
    bibliography = document.createElement("bibliography");
    author3.appendChild(bibliography);
    
    assertArrayEquals("Carmelo Montanez", [author1],
            xpath.evaluateImpl("author[name/@real='no']|author[name/@real='yes']", document, book1).nodes);
    
    assertArrayEquals("empty", [],
            xpath.evaluateImpl("author[name/@real='no']|author[name/@real='yes']", document, book2).nodes);
    
    assertArrayEquals("Mary Brady", [author3],
            xpath.evaluateImpl("author[name/@real='no']|author[name/@real='yes']", document, book3).nodes);
};

exports.tests.NIST_expression006 = function() {
    var document = getImplementation().createDocument();
    var doc = document.createElement("doc");
    doc.setAttribute("attr1", "attribute 1 ");
    doc.setAttribute("attr2", "attribute 2");
    document.appendChild(doc);
    var sub1 = document.createElement("sub1");
    doc.appendChild(sub1);
    var child1 = document.createElement("child1");
    sub1.appendChild(child1);
    var text = document.createTextNode("child number 1");
    child1.appendChild(text);
    var sub2 = document.createElement("sub2");
    doc.appendChild(sub2);
    var child2 = document.createElement("child2");
    text = document.createTextNode("child number 2");
    child2.appendChild(text);
    
    assertArrayEquals("attributes", [doc.getAttributeNode("attr1"), doc.getAttributeNode("attr2")],
            xpath.evaluateImpl("attribute::attr1|attribute::attr2", document, doc).nodes);
};

exports.tests.NIST_expression007 = function() {
    var document = getImplementation().createDocument();
    var doc = document.createElement("doc");
    doc.setAttribute("attr1", "attribute 1 ");
    doc.setAttribute("attr2", "attribute 2");
    document.appendChild(doc);
    var sub1 = document.createElement("sub1");
    doc.appendChild(sub1);
    var child1 = document.createElement("child1");
    sub1.appendChild(child1);
    var text = document.createTextNode("child number 1");
    child1.appendChild(text);
    var sub2 = document.createElement("sub2");
    doc.appendChild(sub2);
    var child2 = document.createElement("child2");
    text = document.createTextNode("child number 2");
    child2.appendChild(text);
    
    assertArrayEquals("sub1|sub2", [sub1, sub2],
            xpath.evaluateImpl("child::sub1|child::sub2", document, doc).nodes);
};

exports.tests.NIST_expression008 = function() {
    var document = getImplementation().createDocument();
    var doc = document.createElement("doc");
    document.appendChild(doc);
    var book1 = document.createElement("book");
    doc.appendChild(book1);
    var author1 = document.createElement("author");
    book1.appendChild(author1);
    var name = document.createElement("name");
    author1.appendChild(name);
    name.setAttribute("real", "no");
    var text = document.createTextNode("Carmelo Montanez");
    name.appendChild(text);
    var chapters = document.createElement("chapters");
    author1.appendChild(chapters);
    text = document.createTextNode("Nine");
    chapters.appendChild(text);
    var bibliography = document.createElement("bibliography");
    author1.appendChild(bibliography);
    var book2 = document.createElement("book");
    doc.appendChild(book2);
    var author2 = document.createElement("author");
    book2.appendChild(author2);
    name = document.createElement("name");
    author2.appendChild(name);
    name.setAttribute("real", "na");
    text = document.createTextNode("David Marston");
    name.appendChild(text);
    chapters = document.createElement("chapters");
    author2.appendChild(chapters);
    text = document.createTextNode("Seven");
    chapters.appendChild(text);
    bibliography = document.createElement("bibliography");
    author2.appendChild(bibliography);
    var book3 = document.createElement("book");
    doc.appendChild(book3);
    var author3 = document.createElement("author");
    book3.appendChild(author3);
    name = document.createElement("name");
    author3.appendChild(name);
    name.setAttribute("real", "yes");
    text = document.createTextNode("Mary Brady");
    name.appendChild(text);
    chapters = document.createElement("chapters");
    author3.appendChild(chapters);
    text = document.createTextNode("Ten");
    bibliography = document.createElement("bibliography");
    author3.appendChild(bibliography);
    
    assertArrayEquals("Carmelo Montanez", [author1],
            xpath.evaluateImpl("author[(name/@real='no' and position()=1)]|author[(name/@real='yes' and position()=last())]", document, book1).nodes);
    
    assertArrayEquals("empty", [],
            xpath.evaluateImpl("author[(name/@real='no' and position()=1)]|author[(name/@real='yes' and position()=last())]", document, book2).nodes);
    
    assertArrayEquals("Mary Brady", [author3],
            xpath.evaluateImpl("author[(name/@real='no' and position()=1)]|author[(name/@real='yes' and position()=last())]", document, book3).nodes);
};

exports.tests.NIST_expression009 = function() {
    var document = getImplementation().createDocument();
    var doc = document.createElement("doc");
    document.appendChild(doc);
    var sub1 = document.createElement("sub1");
    doc.appendChild(sub1);
    var child1 = document.createElement("child1");
    sub1.appendChild(child1);
    var text = document.createTextNode("descendant number 1");
    child1.appendChild(text);
    var sub2 = document.createElement("sub2");
    doc.appendChild(sub2);
    var child2 = document.createElement("child2");
    sub2.appendChild(child2);
    text = document.createTextNode("descendant number 2");
    child2.appendChild(text);
    
    assertArrayEquals("child1|child2", [child1,child2],
            xpath.evaluateImpl("descendant::child1|descendant::child2", document, doc).nodes);
};

exports.tests.NIST_expression010 = function() {
    var document = getImplementation().createDocument();
    var doc = document.createElement("doc");
    document.appendChild(doc);
    var sub1 = document.createElement("sub1");
    doc.appendChild(sub1);
    var child1 = document.createElement("child1");
    sub1.appendChild(child1);
    var text = document.createTextNode("descendant number 1");
    child1.appendChild(text);
    var sub2 = document.createElement("sub2");
    doc.appendChild(sub2);
    var child2 = document.createElement("child2");
    sub2.appendChild(child2);
    text = document.createTextNode("descendant number 2");
    child2.appendChild(text);
    
    assertArrayEquals("doc", [doc],
            xpath.evaluateImpl("descendant-or-self::doc|descendant-or-self::doc", document, doc).nodes);
};

exports.tests.NIST_expression011 = function() {
    var document = getImplementation().createDocument();
    var doc = document.createElement("doc");
    document.appendChild(doc);
    var book1 = document.createElement("book");
    doc.appendChild(book1);
    var author1 = document.createElement("author");
    book1.appendChild(author1);
    var name = document.createElement("name");
    author1.appendChild(name);
    name.setAttribute("real", "no");
    var text = document.createTextNode("Carmelo Montanez");
    name.appendChild(text);
    var chapters = document.createElement("chapters");
    author1.appendChild(chapters);
    text = document.createTextNode("Nine");
    chapters.appendChild(text);
    var bibliography = document.createElement("bibliography");
    author1.appendChild(bibliography);
    var book2 = document.createElement("book");
    doc.appendChild(book2);
    var author2 = document.createElement("author");
    book2.appendChild(author2);
    name = document.createElement("name");
    author2.appendChild(name);
    name.setAttribute("real", "na");
    text = document.createTextNode("David Marston");
    name.appendChild(text);
    chapters = document.createElement("chapters");
    author2.appendChild(chapters);
    text = document.createTextNode("Seven");
    chapters.appendChild(text);
    bibliography = document.createElement("bibliography");
    author2.appendChild(bibliography);
    var book3 = document.createElement("book");
    doc.appendChild(book3);
    var author3 = document.createElement("author");
    book3.appendChild(author3);
    name = document.createElement("name");
    author3.appendChild(name);
    name.setAttribute("real", "yes");
    text = document.createTextNode("Mary Brady");
    name.appendChild(text);
    chapters = document.createElement("chapters");
    author3.appendChild(chapters);
    text = document.createTextNode("Ten");
    bibliography = document.createElement("bibliography");
    author3.appendChild(bibliography);
    
    assertArrayEquals("Carmelo Montanez", [author1],
            xpath.evaluateImpl("author[name='Mary Brady']|author[name/@real='no']", document, book1).nodes);
    
    assertArrayEquals("empty", [],
            xpath.evaluateImpl("author[name='Mary Brady']|author[name/@real='no']", document, book2).nodes);
    
    assertArrayEquals("Mary Brady", [author3],
            xpath.evaluateImpl("author[name='Mary Brady']|author[name/@real='no']", document, book3).nodes);
};

// expression012 tests XPath variables, amongst other features, and is
// omitted as above for other tests. A modified version that does not test
// variables is included below.

// exports.tests.NIST_expression012 = function() {
//     var document = getImplementation().createDocument();
//     var doc = document.createElement("doc");
//     document.appendChild(doc);
//     var child1 = document.createElement("child1");
//     doc.appendChild(child1);
//     var text = document.createTextNode("child number 1");
//     child.appendChild(text);
//     var child2 = document.createElement("child2");
//     doc.appendChild(child2);
//     text = document.createTextNode("child number 2");
//     child2.appendChild(text);
//     var child3 = document.createElement("child3");
//     doc.appendChild(child3);
//     text = document.createTextNode("Selection of this child is an error.");
//     child3.appendChild(text);
//     
//     var result1 = xpath.evaluateImpl("//noChild1", document, doc);
//     assertArrayEquals("empty //noChild1", [], result1.nodes);
//     
//     var result2 = xpath.evaluateImpl("//noChild2", document, doc);
//     assertArrayEquals("empty //noChild2", [], result2.nodes);
//     
//     // set $var1 = result1.nodes
//     // set $var2 = result2.nodes
//     
//     assertArrayEquals("empty $var1|$var2", [],
//             xpath.evaluateImpl("$var1|$var2", document, docu));
// };

exports.tests.NIST_expression012_noVariables = function() {
    var document = getImplementation().createDocument();
    var doc = document.createElement("doc");
    document.appendChild(doc);
    var child1 = document.createElement("child1");
    doc.appendChild(child1);
    var text = document.createTextNode("child number 1");
    child1.appendChild(text);
    var child2 = document.createElement("child2");
    doc.appendChild(child2);
    text = document.createTextNode("child number 2");
    child2.appendChild(text);
    var child3 = document.createElement("child3");
    doc.appendChild(child3);
    text = document.createTextNode("Selection of this child is an error.");
    child3.appendChild(text);
    
    assertArrayEquals("empty //noChild1", [],
            xpath.evaluateImpl("//noChild1", document, doc).nodes);
    
    assertArrayEquals("empty //noChild2", [],
            xpath.evaluateImpl("//noChild2", document, doc).nodes);
    
    assertArrayEquals("empty //noChild1|//noChild2", [],
            xpath.evaluateImpl("//noChild1|//noChild2", document, doc).nodes);
};

exports.tests.NIST_expression013 = function() {
    var document = getImplementation().createDocument();
    var doc = document.createElement("doc");
    document.appendChild(doc);
    var sub1 = document.createElement("sub1");
    doc.appendChild(sub1);
    var child1 = document.createElement("child1");
    sub1.appendChild(child1);
    var text = document.createTextNode("preceding sibling number 1");
    child1.appendChild(text);
    var child2 = document.createElement("child2");
    sub1.appendChild(child2);
    text = document.createTextNode("current node");
    child2.appendChild(text);
    var child3 = document.createElement("child3");
    sub1.appendChild(child3);
    text = document.createTextNode("following sibling number 3");
    child3.appendChild(text);
    
    assertArrayEquals("child2", [child2],
            xpath.evaluateImpl("//child2", document, doc).nodes);
    
    assertArrayEquals("child1|child3", [child1, child3],
            xpath.evaluateImpl("preceding-sibling::child1|following-sibling::child3", document, child2).nodes);
};

// expression014 and expression015 are omitted because they test the XSLT
// key() function.

exports.tests.NIST_expression016 = function() {
    var document = getImplementation().createDocument();
    var doc = document.createElement("doc");
    document.appendChild(doc);
    var book1 = document.createElement("book");
    doc.appendChild(book1);
    var author1 = document.createElement("author");
    book1.appendChild(author1);
    var name1 = document.createElement("name");
    author1.appendChild(name1);
    name1.setAttribute("real", "no");
    var text = document.createTextNode("Carmelo Montanez");
    name1.appendChild(text);
    var chapters = document.createElement("chapters");
    author1.appendChild(chapters);
    text = document.createTextNode("Nine");
    chapters.appendChild(text);
    var bibliography = document.createElement("bibliography");
    author1.appendChild(bibliography);
    var book2 = document.createElement("book");
    doc.appendChild(book2);
    var author2 = document.createElement("author");
    book2.appendChild(author2);
    var name2 = document.createElement("name");
    author2.appendChild(name2);
    name2.setAttribute("real", "na");
    text = document.createTextNode("David Marston");
    name2.appendChild(text);
    chapters = document.createElement("chapters");
    author2.appendChild(chapters);
    text = document.createTextNode("Seven");
    chapters.appendChild(text);
    bibliography = document.createElement("bibliography");
    author2.appendChild(bibliography);
    var book3 = document.createElement("book");
    doc.appendChild(book3);
    var author3 = document.createElement("author");
    book3.appendChild(author3);
    var name3 = document.createElement("name");
    author3.appendChild(name3);
    name3.setAttribute("real", "yes");
    text = document.createTextNode("Mary Brady");
    name3.appendChild(text);
    chapters = document.createElement("chapters");
    author3.appendChild(chapters);
    text = document.createTextNode("Ten");
    bibliography = document.createElement("bibliography");
    author3.appendChild(bibliography);
    var author4 = document.createElement("author");
    bibliography.appendChild(author4);
    var name4 = document.createElement("name");
    author4.appendChild(name4);
    text = document.createTextNode("Lynne Rosenthal");
    name4.appendChild(text);
    chapters = document.createElement("chapters");
    author4.appendChild(chapters);
    text = document.createTextNode("Five");
    chapters.appendChild(text);
    
    assertArrayEquals("name1", [name1],
            xpath.evaluateImpl("author/name|author/bibliography/author/name", document, book1).nodes);
    
    assertArrayEquals("name2", [name2],
            xpath.evaluateImpl("author/name|author/bibliography/author/name", document, book2).nodes);
    
    assertArrayEquals("name3|name4", [name3, name4],
            xpath.evaluateImpl("author/name|author/bibliography/author/name", document, book3).nodes);
};

exports.tests.NIST_expression017 = function() {
    var document = getImplementation().createDocument();
    var doc = document.createElement("doc");
    document.appendChild(doc);
    var book1 = document.createElement("book");
    doc.appendChild(book1);
    var author1 = document.createElement("author");
    book1.appendChild(author1);
    var name1 = document.createElement("name");
    author1.appendChild(name1);
    name1.setAttribute("real", "no");
    var text = document.createTextNode("Carmelo Montanez");
    name1.appendChild(text);
    var chapters = document.createElement("chapters");
    author1.appendChild(chapters);
    text = document.createTextNode("Nine");
    chapters.appendChild(text);
    var bibliography = document.createElement("bibliography");
    author1.appendChild(bibliography);
    var book2 = document.createElement("book");
    doc.appendChild(book2);
    var author2 = document.createElement("author");
    book2.appendChild(author2);
    var name2 = document.createElement("name");
    author2.appendChild(name2);
    name2.setAttribute("real", "na");
    text = document.createTextNode("David Marston");
    name2.appendChild(text);
    chapters = document.createElement("chapters");
    author2.appendChild(chapters);
    text = document.createTextNode("Seven");
    chapters.appendChild(text);
    bibliography = document.createElement("bibliography");
    author2.appendChild(bibliography);
    var book3 = document.createElement("book");
    doc.appendChild(book3);
    var author3 = document.createElement("author");
    book3.appendChild(author3);
    var name3 = document.createElement("name");
    author3.appendChild(name3);
    name3.setAttribute("real", "yes");
    text = document.createTextNode("Mary Brady");
    name3.appendChild(text);
    chapters = document.createElement("chapters");
    author3.appendChild(chapters);
    text = document.createTextNode("Ten");
    bibliography = document.createElement("bibliography");
    author3.appendChild(bibliography);
    var author4 = document.createElement("author");
    bibliography.appendChild(author4);
    var name4 = document.createElement("name");
    author4.appendChild(name4);
    text = document.createTextNode("Lynne Rosenthal");
    name4.appendChild(text);
    chapters = document.createElement("chapters");
    author4.appendChild(chapters);
    text = document.createTextNode("Five");
    chapters.appendChild(text);
    
    assertArrayEquals("name1", [name1],
            xpath.evaluateImpl("author/name|author/bibliography/author/chapters", document, book1).nodes);
    
    assertArrayEquals("name2", [name2],
            xpath.evaluateImpl("author/name|author/bibliography/author/chapters", document, book2).nodes);
    
    assertArrayEquals("name3|chapters", [name3, chapters],
            xpath.evaluateImpl("author/name|author/bibliography/author/chapters", document, book3).nodes);
};

exports.tests.NIST_expression018 = function() {
    var document = getImplementation().createDocument();
    var doc = document.createElement("doc");
    document.appendChild(doc);
    var book1 = document.createElement("book");
    doc.appendChild(book1);
    var author1 = document.createElement("author");
    book1.appendChild(author1);
    var name1 = document.createElement("name");
    author1.appendChild(name1);
    name1.setAttribute("real", "na");
    var text = document.createTextNode("David Marston");
    name1.appendChild(text);
    var chapters1 = document.createElement("chapters");
    author1.appendChild(chapters1);
    text = document.createTextNode("Seven");
    chapters1.appendChild(text);
    var bibliography1 = document.createElement("bibliography");
    author1.appendChild(bibliography1);
    var book2 = document.createElement("book");
    doc.appendChild(book2);
    var author2 = document.createElement("author");
    book2.appendChild(author2);
    var name2 = document.createElement("name");
    author2.appendChild(name2);
    name2.setAttribute("real", "yes");
    text = document.createTextNode("Mary Brady");
    name2.appendChild(text);
    var chapters2 = document.createElement("chapters");
    author2.appendChild(chapters2);
    text = document.createTextNode("Ten");
    chapters2.appendChild(text);
    var bibliography2 = document.createElement("bibliography");
    author2.appendChild(bibliography2);
    
    assertArrayEquals("name1", [name1],
            xpath.evaluateImpl("author/name|author/noElement", document, book1).nodes);
    
    assertArrayEquals("name2", [name2],
            xpath.evaluateImpl("author/name|author/noElement", document, book2).nodes);
};