/* string.js */

String.interpret = function(value)
{
  return value == null ? '' : String(value);	
};

String.prototype.gsub = function(pattern, replacement) 
{
    var result = '', source = this, match;
    replacement = arguments.callee.prepareReplacement(replacement);

    while (source.length > 0) {
      if (match = source.match(pattern)) {
        result += source.slice(0, match.index);
        result += String.interpret(replacement(match));
        source  = source.slice(match.index + match[0].length);
      } else {
        result += source, source = '';
      }
    }
    return result;
};
String.prototype.strip = function() 
{
  return this.replace(/^\s+/, '').replace(/\s+$/, '');
},

String.prototype.gsub.prepareReplacement = function(replacement) 
{
	if (typeof(replacement) == "function") return replacement;
	var template = new App.Wel.Template(replacement);
	return function(match) { return template.evaluate(match) };
};
String.prototype.trim = function()
{
    return this.replace(/^\s+/g, '').replace(/\s+$/g, '');
};
String.prototype.startsWith=  function(value)
{
    if (value.length <= this.length)
    {
        return this.substring(0, value.length) == value;
    }
    return false;
};
String.prototype.capitalize = function()
{
	this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
}
String.prototype.toFunction = function (dontPreProcess)
{
    var str = this.trim();
    if (str.length == 0)
    {
        return function() { };
    }
    if (!dontPreProcess)
    {
        if (str.match(/^function\(/))
        {
            str = 'return ' + str.unescapeXML() + '()';
        }
        else if (!str.match(/return/))
        {
            str = 'return ' + str.unescapeXML();
        }
        else if (str.match(/^return function/))
        {
            // invoke it as the return value
            str = str.unescapeXML() + ' ();';
        }
    }
    var code = 'var f = function(){ var args = swiss.toArray(arguments); ' + str + '}; f;';
    var func = eval(code);
    if (typeof(func) == 'function')
    {
        return func;
    }
    throw Error('code was not a function: ' + this);
}

/**
 * unescape XML entities back into their normal values
 */
String.prototype.unescapeXML = function()
{
    if (!this) return null;
    return this.replace(
	/&lt;/g,   "<").replace(
	/&gt;/g,   ">").replace(
	/&apos;/g, "'").replace(
	/&amp;/g,  "&").replace(
	/&quot;/g, "\"");
};

