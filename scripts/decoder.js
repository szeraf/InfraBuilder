
function bytesToString(arr)
{
    var str = '';

    for (var i = 0; i < arr.length; i++)
    {
        str += String.fromCharCode(arr[i]);
    }

    return str;
};

// decode compressed xml
function decode(data)
{
    try
    {
        var node = parseXml(data).documentElement;

        if (node != null && node.nodeName == 'mxfile')
        {
            var diagrams = node.getElementsByTagName('diagram');

            if (diagrams.length > 0)
            {
                data = getTextContent(diagrams[0]);
            }
        }
    }
    catch (e)
    {
        // ignore
        console.log(e);
    }

    try
    {
        data = atob(data);
    }
    catch (e)
    {
        console.log(e);
        alert('atob failed: ' + e);
        
        return;
    }

    if (data.length > 0)
    {
        try
        {
            data = bytesToString(pako.inflateRaw(data));
        }
        catch (e)
        {
            console.log(e);
            alert('inflateRaw failed: ' + e);
            
            return;
        }
    }

    try
    {
        data = decodeURIComponent(data);
    }
    catch (e)
    {
        console.log(e);
        alert('decodeURIComponent failed: ' + e);
        
        return;
    }

    if (data.length > 0)
    {
        return data;
    }
};

function parseXml(xml)
{
    if (window.DOMParser)
    {
        var parser = new DOMParser();

        return parser.parseFromString(xml, 'text/xml');
    }
    else
    {
        var result = createXmlDocument();

        result.async = 'false';
        result.loadXML(xml);

        return result;
    }
};

function createXmlDocument()
{
    var doc = null;

    if (document.implementation && document.implementation.createDocument)
    {
        doc = document.implementation.createDocument('', '', null);
    }
    else if (window.ActiveXObject)
    {
        doc = new ActiveXObject('Microsoft.XMLDOM');
    }

    return doc;
};

function getTextContent(node)
{
    return (node != null) ? node[(node.textContent === undefined) ? 'text' : 'textContent'] : '';
};