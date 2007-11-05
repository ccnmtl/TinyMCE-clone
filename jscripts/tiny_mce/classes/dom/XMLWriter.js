/**
 * $Id$
 *
 * @author Moxiecode
 * @copyright Copyright � 2004-2007, Moxiecode Systems AB, All rights reserved.
 */

(function() {
	/**
	 * This class writes nodes into a XML document structure. This structure can then be
	 * serialized down to a HTML string later on.
	 */
	tinymce.create('tinymce.dom.XMLWriter', {
		node : null,

		/**
		 * Constructs a new XMLWriter.
		 *
		 * @param {Object} s Optional settings object.
		 */
		XMLWriter : function(s) {
			// Get XML document
			function getXML() {
				var i = document.implementation;

				if (!i || !i.createDocument) {
					// Try IE objects
					try {return new ActiveXObject('MSXML2.DOMDocument');} catch (ex) {}
					try {return new ActiveXObject('Microsoft.XmlDom');} catch (ex) {}
				} else
					return i.createDocument('', '', null);
			};

			this.doc = getXML();
			this.reset();
		},

		/**
		 * Resets the writer so it can be reused the contents of the writer is cleared.
		 */
		reset : function() {
			var t = this, d = t.doc;

			if (d.firstChild)
				d.removeChild(d.firstChild);

			t.node = d.appendChild(d.createElement("html"));
		},

		/**
		 * Writes the start of an element like for example: <tag.
		 *
		 * @param {String} n Name of element to write.
		 */
		writeStartElement : function(n) {
			var t = this;

			t.node = t.node.appendChild(t.doc.createElement(n));
		},

		/**
		 * Writes an attrubute like for example: myattr="valie"
		 *
		 * @param {String} n Attribute name to write.
		 * @param {String} v Attribute value to write.
		 */
		writeAttribute : function(n, v) {
			// Since Opera doesn't escape > into &gt; we need to do it our self
			if (tinymce.isOpera)
				v = v.replace(/>/g, '|>');

			this.node.setAttribute(n, v);
		},

		/**
		 * Write the end of a element. This will add a short end for elements with out children like for example a img element.
		 */
		writeEndElement : function() {
			this.node = this.node.parentNode;
		},

		/**
		 * Writes the end of a element. This will add a full end to the element even if it didn't have any children.
		 */
		writeFullEndElement : function() {
			var t = this, n = t.node;

			n.appendChild(t.doc.createTextNode(""));
			t.node = n.parentNode;
		},

		/**
		 * Writes a text node value.
		 *
		 * @param {String} v Value to append as a text node.
		 */
		writeText : function(v) {
			// Since Opera doesn't escape > into &gt; we need to do it our self
			if (tinymce.isOpera)
				v = v.replace(/>/g, '|>');

			this.node.appendChild(this.doc.createTextNode(v));
		},

		/**
		 * Writes a CDATA section.
		 *
		 * @param {String} v Value to write in CDATA.
		 */
		writeCDATA : function(v) {
			this.node.appendChild(this.doc.createCDATA(v));
		},

		/**
		 * Writes a comment.
		 *
		 * @param {String} v Value of the comment.
		 */
		writeComment : function(v) {
			this.node.appendChild(this.doc.createComment(v));
		},

		/**
		 * Returns a string representation of the elements/nodes written.
		 *
		 * @return {String} String representation of the written elements/nodes.
		 */
		getContent : function() {
			var h;

			h = this.doc.xml || new XMLSerializer().serializeToString(this.doc);
			h = h.replace(/<\?[^?]+\?>|<html>|<\/html>/g, '');
			h = h.replace(/ ?\/>/g, ' />');

			// Since Opera doesn't escape > into &gt; we need to do it our self
			if (tinymce.isOpera)
				h = h.replace(/\|>/g, '&gt;');

			return h;
		}
	});
})();
