// jsonProfileSchema.js — convert a Boomi JSON profile component XML into a
// Draft 4 JSON Schema and a representative sample JSON document.
//
// Boomi exposes profiles as Component XML (type="profile.json") but has no
// native export. The structure is read from the Component API and rebuilt
// here into the two export formats.

var buildJsonProfileExport = function (xmlString) {
  var parser = new DOMParser();
  var xmlDocument = parser.parseFromString(xmlString, "text/xml");
  if (xmlDocument.querySelector("parsererror")) {
    return { supported: false, reason: "parse-error" };
  }

  var componentElement = xmlDocument.getElementsByTagNameNS("*", "Component")[0];
  var componentType = componentElement ? componentElement.getAttribute("type") : "";
  if (componentType !== "profile.json") {
    return { supported: false, reason: "not-json-profile", componentType: componentType };
  }

  var profileElement = xmlDocument.getElementsByTagNameNS("*", "JSONProfile")[0];
  if (!profileElement) {
    return { supported: false, reason: "no-json-profile" };
  }

  var rootValue = profileElement.getElementsByTagNameNS("*", "JSONRootValue")[0];
  if (!rootValue) {
    return { supported: false, reason: "no-root" };
  }

  var componentName = componentElement.getAttribute("name") || "JSON Profile";
  var rootSchema = buildJsonProfileRootSchema(rootValue);

  var documentSchema = {
    $schema: "http://json-schema.org/draft-04/schema#",
    title: componentName,
  };
  for (var key in rootSchema) {
    if (Object.prototype.hasOwnProperty.call(rootSchema, key)) {
      documentSchema[key] = rootSchema[key];
    }
  }

  var sampleDocument = buildJsonProfileSample(rootSchema);
  var fieldCount = profileElement.getElementsByTagNameNS("*", "JSONObjectEntry").length;

  return {
    supported: true,
    componentName: componentName,
    fieldCount: fieldCount,
    schemaText: JSON.stringify(documentSchema, null, 2),
    sampleText: JSON.stringify(sampleDocument, null, 2),
  };
};

function buildJsonProfileRootSchema(rootValue) {
  var objectChild = firstDirectChildByLocalName(rootValue, "JSONObject");
  if (objectChild) return buildJsonProfileObjectSchema(objectChild);

  var arrayChild = firstDirectChildByLocalName(rootValue, "JSONArray");
  if (arrayChild) return buildJsonProfileArraySchema(arrayChild);

  if (directChildrenByLocalName(rootValue, "JSONObjectEntry").length > 0) {
    return buildJsonProfileObjectSchema(rootValue);
  }

  return buildJsonProfileSimpleSchema(rootValue);
}

function buildJsonProfileObjectSchema(objectElement) {
  var schema = { type: "object", properties: {} };
  var requiredNames = [];
  var entries = directChildrenByLocalName(objectElement, "JSONObjectEntry");

  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var entryName = entry.getAttribute("name") || "field" + (i + 1);
    schema.properties[entryName] = buildJsonProfileEntrySchema(entry);
    if (entry.getAttribute("required") === "true") {
      requiredNames.push(entryName);
    }
  }

  if (requiredNames.length > 0) {
    schema.required = requiredNames;
  }

  return schema;
}

function buildJsonProfileEntrySchema(entry) {
  var objectChild = firstDirectChildByLocalName(entry, "JSONObject");
  if (objectChild) return buildJsonProfileObjectSchema(objectChild);

  var arrayChild = firstDirectChildByLocalName(entry, "JSONArray");
  if (arrayChild) return buildJsonProfileArraySchema(arrayChild);

  return buildJsonProfileSimpleSchema(entry);
}

function buildJsonProfileArraySchema(arrayElement) {
  var elementType = arrayElement.getAttribute("elementType") || "repeating";
  var arrayElements = directChildrenByLocalName(arrayElement, "JSONArrayElement");

  if (elementType === "absolute") {
    var tupleItems = [];
    for (var i = 0; i < arrayElements.length; i++) {
      tupleItems.push(buildJsonProfileArrayElementSchema(arrayElements[i]));
    }
    return {
      type: "array",
      items: tupleItems,
      minItems: tupleItems.length,
      maxItems: tupleItems.length,
    };
  }

  var firstElement = arrayElements[0];
  var arraySchema = {
    type: "array",
    items: firstElement ? buildJsonProfileArrayElementSchema(firstElement) : {},
  };

  if (firstElement) {
    var minOccurs = parseInt(firstElement.getAttribute("minOccurs"), 10);
    var maxOccurs = parseInt(firstElement.getAttribute("maxOccurs"), 10);
    if (!isNaN(minOccurs) && minOccurs > 0) arraySchema.minItems = minOccurs;
    if (!isNaN(maxOccurs) && maxOccurs >= 0) arraySchema.maxItems = maxOccurs;
  }

  return arraySchema;
}

function buildJsonProfileArrayElementSchema(arrayElement) {
  var objectChild = firstDirectChildByLocalName(arrayElement, "JSONObject");
  if (objectChild) return buildJsonProfileObjectSchema(objectChild);

  var arrayChild = firstDirectChildByLocalName(arrayElement, "JSONArray");
  if (arrayChild) return buildJsonProfileArraySchema(arrayChild);

  return buildJsonProfileSimpleSchema(arrayElement);
}

function buildJsonProfileSimpleSchema(element) {
  var dataType = element.getAttribute("dataType") || "character";
  var schema;

  if (dataType === "number") {
    schema = { type: "number" };
  } else if (dataType === "boolean") {
    schema = { type: "boolean" };
  } else if (dataType === "datetime") {
    schema = { type: "string", format: "date-time" };
  } else {
    schema = { type: "string" };
  }

  var description = element.getAttribute("description");
  if (!description) {
    var descriptionChild = firstDirectChildByLocalName(element, "description");
    if (descriptionChild) description = descriptionChild.textContent.trim();
  }
  if (description) {
    schema.description = description;
  }

  var minLength = parseInt(element.getAttribute("minLength"), 10);
  var maxLength = parseInt(element.getAttribute("maxLength"), 10);
  if (!isNaN(minLength) && minLength > 0) schema.minLength = minLength;
  if (!isNaN(maxLength) && maxLength > 0) schema.maxLength = maxLength;

  return schema;
}

function buildJsonProfileSample(schema) {
  if (!schema || typeof schema !== "object") return null;

  if (schema.type === "object") {
    var sampleObject = {};
    var properties = schema.properties || {};
    for (var propertyName in properties) {
      if (Object.prototype.hasOwnProperty.call(properties, propertyName)) {
        sampleObject[propertyName] = buildJsonProfileSample(properties[propertyName]);
      }
    }
    return sampleObject;
  }

  if (schema.type === "array") {
    if (Array.isArray(schema.items)) {
      var sampleTuple = [];
      for (var i = 0; i < schema.items.length; i++) {
        sampleTuple.push(buildJsonProfileSample(schema.items[i]));
      }
      return sampleTuple;
    }
    return [buildJsonProfileSample(schema.items)];
  }

  if (schema.type === "number" || schema.type === "integer") return 0;
  if (schema.type === "boolean") return false;
  if (schema.format === "date-time") return "2020-01-01T00:00:00Z";
  return "string";
}

function firstDirectChildByLocalName(element, localName) {
  for (var i = 0; i < element.children.length; i++) {
    if (element.children[i].localName === localName) return element.children[i];
  }
  return null;
}

function directChildrenByLocalName(element, localName) {
  var matchingChildren = [];
  for (var i = 0; i < element.children.length; i++) {
    if (element.children[i].localName === localName) {
      matchingChildren.push(element.children[i]);
    }
  }
  return matchingChildren;
}
