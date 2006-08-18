/**
 * $Id$
 *
 * @author Moxiecode
 * @copyright Copyright � 2004-2006, Moxiecode Systems AB, All rights reserved.
 */

/**
 * Constructs a Selection instance and binds it to the specificed TinyMCE editor control.
 *
 * @param {TinyMCE_Control} inst TinyMCE editor control instance.
 * @constructor
 */
function TinyMCE_Selection(inst) {
	this.instance = inst;
};

TinyMCE_Selection.prototype = {
	/**
	 * Returns the selected HTML code.
	 *
	 * @return Selected HTML contents.
	 * @type string
	 */
	getSelectedHTML : function() {
		var inst = this.instance;
		var e, r = this.getRng(), h;

		if (tinyMCE.isSafari) {
			// Not realy perfect!!
			return r.toString();
		}

		e = document.createElement("body");

		if (tinyMCE.isGecko)
			e.appendChild(r.cloneContents());
		else 
			e.innerHTML = r.item ? r.item(0).outerHTML : r.htmlText;

		h = tinyMCE._cleanupHTML(inst, inst.contentDocument, inst.settings, e, e, false, true, false);

		// When editing always use fonts internaly
		if (tinyMCE.getParam("convert_fonts_to_spans"))
			tinyMCE.convertSpansToFonts(inst.getDoc());

		return h;
	},

	/**
	 * Returns the selected text.
	 *
	 * @return Selected text contents.
	 * @type string
	 */
	getSelectedText : function() {
		var inst = this.instance;
		var d, r, s, t;

		if (tinyMCE.isMSIE) {
			d = inst.getDoc();

			if (d.selection.type == "Text") {
				r = d.selection.createRange();
				t = r.text;
			} else
				t = '';
		} else {
			s = this.getSel();

			if (s && s.toString)
				t = s.toString();
			else
				t = '';
		}

		return t;
	},

	/**
	 * Returns a selection bookmark that can be restored later with moveToBookmark.
	 * This acts much like the one MSIE has built in but this one is persistent if between DOM
	 * tree rewritings. The simple mode enables a quicker and non persistent bookmark.
	 *
	 * @param {boolean} simple If this is set to true, the selection bookmark will not me dom persistent.
	 * @return Selection bookmark that can be restored later with moveToBookmark.
	 * @type TinyMCE_Bookmark
	 */
	getBookmark : function(simple) {
		var inst = this.instance;
		var rng = this.getRng();
		var doc = inst.getDoc(), b = inst.getBody();
		var sp, le, s, e, nl, i, si, ei, w;
		var trng, sx, sy, xx = -999999999;

		// Skip Opera for now
		if (tinyMCE.isOpera)
			return null;

		sx = doc.body.scrollLeft + doc.documentElement.scrollLeft;
		sy = doc.body.scrollTop + doc.documentElement.scrollTop;

		if (tinyMCE.isSafari || simple)
			return {rng : rng, scrollX : sx, scrollY : sy};

		if (tinyMCE.isMSIE) {
			if (rng.item) {
				e = rng.item(0);

				nl = doc.getElementsByTagName(e.nodeName);
				for (i=0; i<nl.length; i++) {
					if (e == nl[i]) {
						sp = i;
						break;
					}
				}

				return {
					tag : e.nodeName,
					index : sp,
					scrollX : sx,
					scrollY : sy
				};
			} else {
				trng = rng.duplicate();
				trng.collapse(true);
				sp = Math.abs(trng.move('character', xx));

				trng = rng.duplicate();
				trng.collapse(false);
				le = Math.abs(trng.move('character', xx)) - sp;

				return {
					start : sp,
					length : le,
					scrollX : sx,
					scrollY : sy
				};
			}
		}

		if (tinyMCE.isGecko) {
			s = this.getSel();
			e = this.getFocusElement();

			if (e && e.nodeName == 'IMG') {
				return {
					start : -1,
					end : -1,
					scrollX : sx,
					scrollY : sy
				};
			}

			// Caret or selection
			if (s.anchorNode == s.focusNode && s.anchorOffset == s.focusOffset) {
				e = this._getPosText(b, s.anchorNode, s.focusNode);

				if (!e)
					return {scrollX : sx, scrollY : sy};

				return {
					start : e.start + s.anchorOffset,
					end : e.end + s.focusOffset,
					scrollX : sx,
					scrollY : sy
				};
			} else {
				e = this._getPosText(b, rng.startContainer, rng.endContainer);

				if (!e)
					return {scrollX : sx, scrollY : sy};

				return {
					start : e.start + rng.startOffset,
					end : e.end + rng.endOffset,
					scrollX : sx,
					scrollY : sy
				};
			}
		}

		return null;
	},

	/**
	 * Restores the selection to the specified bookmark.
	 *
	 * @param {TinyMCE_Bookmark} bookmark Bookmark to restore selection from.
	 * @return true/false if it was successful or not.
	 * @type boolean
	 */
	moveToBookmark : function(bookmark) {
		var inst = this.instance;
		var rng, nl, i, ex, b = inst.getBody(), sd;
		var doc = inst.getDoc();
		var win = inst.getWin();
		var sel = this.getSel();

		if (!bookmark)
			return false;

		if (tinyMCE.isSafari) {
			sel.setBaseAndExtent(bookmark.rng.startContainer, bookmark.rng.startOffset, bookmark.rng.endContainer, bookmark.rng.endOffset);
			return true;
		}

		if (tinyMCE.isMSIE) {
			if (bookmark.rng) {
				bookmark.rng.select();
				return true;
			}

			win.focus();

			if (bookmark.tag) {
				rng = inst.getBody().createControlRange();

				nl = doc.getElementsByTagName(bookmark.tag);

				if (nl.length > bookmark.index) {
					try {
						rng.addElement(nl[bookmark.index]);
					} catch (ex) {
						// Might be thrown if the node no longer exists
					}
				}
			} else {
				// Try/catch needed since this operation breaks when TinyMCE is placed in hidden divs/tabs
				try {
					rng = inst.getSel().createRange();
					rng.moveToElementText(inst.getBody());
					rng.collapse(true);
					rng.moveStart('character', bookmark.start);
					rng.moveEnd('character', bookmark.length);
				} catch (ex) {
					return true;
				}
			}

			rng.select();

			win.scrollTo(bookmark.scrollX, bookmark.scrollY);
			return true;
		}

		if (tinyMCE.isGecko) {
			if (bookmark.rng) {
				sel.removeAllRanges();
				sel.addRange(bookmark.rng);
			}

			if (bookmark.start != -1 && bookmark.end != -1) {
				try {
					sd = this._getTextPos(b, bookmark.start, bookmark.end);
					rng = doc.createRange();
					rng.setStart(sd.startNode, sd.startOffset);
					rng.setEnd(sd.endNode, sd.endOffset);
					sel.removeAllRanges();
					sel.addRange(rng);
				} catch (ex) {
					// Ignore
				}
			}

			win.scrollTo(bookmark.scrollX, bookmark.scrollY);
			return true;
		}

		return false;
	},

	/**
	 * Returns the character start and end position of a start end end node. This is Gecko specific logic.
	 *
	 * @param {Element} r Root element to loop through.
	 * @param {Node} sn Start node to get char position of.
	 * @param {Node} en End node to get char position of.
	 * @return Data container with start/end properties.
	 * @type Object
	 */
	_getPosText : function(r, sn, en) {
		var w = document.createTreeWalker(r, NodeFilter.SHOW_TEXT, null, false), n, p = 0, d = {};

		while ((n = w.nextNode()) != null) {
			if (n == sn)
				d.start = p;

			if (n == en) {
				d.end = p;
				return d;
			}

			p += n.nodeValue ? n.nodeValue.length : 0;
		}

		return null;
	},

	/**
	 * Returns the node and offset of start and end character positions. This is Gecko specific logic.
	 *
	 * @param {Element} r Root element to loop through.
	 * @param {int} sp Start character position.
	 * @param {Node} ep End character position.
	 * @return Data container with startNode/startOffset/endNode/endOffset properties.
	 * @type Object
	 */
	_getTextPos : function(r, sp, ep) {
		var w = document.createTreeWalker(r, NodeFilter.SHOW_TEXT, null, false), n, p = 0, d = {};

		while ((n = w.nextNode()) != null) {
			p += n.nodeValue ? n.nodeValue.length : 0;

			if (p >= sp && !d.startNode) {
				d.startNode = n;
				d.startOffset = sp - (p - n.nodeValue.length);
			}

			if (p >= ep) {
				d.endNode = n;
				d.endOffset = ep - (p - n.nodeValue.length);

				return d;
			}
		}

		return null;
	},

	/**
	 * Selects the specified node.
	 *
	 * @param {HTMLNode} node Node object to move selection to.
	 * @param {boolean} collapse True/false if it will be collasped.
	 * @param {boolean} select_text_node True/false if the text contents should be selected or not.
	 * @param {boolean} to_start True/false if the collapse should be to start or end of range.
	 */
	selectNode : function(node, collapse, select_text_node, to_start) {
		var inst = this.instance, sel, rng, nodes;

		if (!node)
			return;

		if (typeof(collapse) == "undefined")
			collapse = true;

		if (typeof(select_text_node) == "undefined")
			select_text_node = false;

		if (typeof(to_start) == "undefined")
			to_start = true;

		if (tinyMCE.isMSIE && !tinyMCE.isOpera) {
			rng = inst.getBody().createTextRange();

			try {
				rng.moveToElementText(node);

				if (collapse)
					rng.collapse(to_start);

				rng.select();
			} catch (e) {
				// Throws illigal agrument in MSIE some times
			}
		} else {
			sel = this.getSel();

			if (!sel)
				return;

			if (tinyMCE.isSafari) {
				sel.setBaseAndExtent(node, 0, node, node.innerText.length);

				if (collapse) {
					if (to_start)
						sel.collapseToStart();
					else
						sel.collapseToEnd();
				}

				this.scrollToNode(node);

				return;
			}

			rng = inst.getDoc().createRange();

			if (select_text_node) {
				// Find first textnode in tree
				nodes = tinyMCE.getNodeTree(node, new Array(), 3);
				if (nodes.length > 0)
					rng.selectNodeContents(nodes[0]);
				else
					rng.selectNodeContents(node);
			} else
				rng.selectNode(node);

			if (collapse) {
				// Special treatment of textnode collapse
				if (!to_start && node.nodeType == 3) {
					rng.setStart(node, node.nodeValue.length);
					rng.setEnd(node, node.nodeValue.length);
				} else
					rng.collapse(to_start);
			}

			sel.removeAllRanges();
			sel.addRange(rng);
		}

		this.scrollToNode(node);

		// Set selected element
		tinyMCE.selectedElement = null;
		if (node.nodeType == 1)
			tinyMCE.selectedElement = node;
	},

	/**
	 * Scrolls to the specified node location.
	 *
	 * @param {HTMLNode} node Node to scroll to.
	 */
	scrollToNode : function(node) {
		var inst = this.instance;
		var pos, doc, scrollX, scrollY, height;

		// Scroll to node position
		pos = tinyMCE.getAbsPosition(node);
		doc = inst.getDoc();
		scrollX = doc.body.scrollLeft + doc.documentElement.scrollLeft;
		scrollY = doc.body.scrollTop + doc.documentElement.scrollTop;
		height = tinyMCE.isMSIE ? document.getElementById(inst.editorId).style.pixelHeight : inst.targetElement.clientHeight;

		// Only scroll if out of visible area
		if (!tinyMCE.settings['auto_resize'] && !(pos.absTop > scrollY && pos.absTop < (scrollY - 25 + height)))
			inst.contentWindow.scrollTo(pos.absLeft, pos.absTop - height + 25); 
	},

	/**
	 * Returns the browsers selection instance.
	 *
	 * @return Browser selection instance.
	 * @type DOMSelection
	 */
	getSel : function() {
		var inst = this.instance;

		if (tinyMCE.isMSIE && !tinyMCE.isOpera)
			return inst.getDoc().selection;

		return inst.contentWindow.getSelection();
	},

	/**
	 * Returns the browsers selections first range instance.
	 *
	 * @return Browsers selections first range instance.
	 * @type DOMRange
	 */
	getRng : function() {
		var inst = this.instance;
		var sel = this.getSel();

		if (sel == null)
			return null;

		if (tinyMCE.isMSIE && !tinyMCE.isOpera)
			return sel.createRange();

		if (tinyMCE.isSafari && !sel.getRangeAt)
			return '' + window.getSelection();

		return sel.getRangeAt(0);
	},

	/**
	 * Returns the currently selected/focused element.
	 *
	 * @return Currently selected element.
	 * @type HTMLElement
	 */
	getFocusElement : function() {
		var inst = this.instance;

		if (tinyMCE.isMSIE && !tinyMCE.isOpera) {
			var doc = inst.getDoc();
			var rng = doc.selection.createRange();

	//		if (rng.collapse)
	//			rng.collapse(true);

			var elm = rng.item ? rng.item(0) : rng.parentElement();
		} else {
			if (!tinyMCE.isSafari && inst.isHidden())
				return inst.getBody();

			var sel = this.getSel();
			var rng = this.getRng();

			if (!sel || !rng)
				return null;

			var elm = rng.commonAncestorContainer;
			//var elm = (sel && sel.anchorNode) ? sel.anchorNode : null;

			// Handle selection a image or other control like element such as anchors
			if (!rng.collapsed) {
				// Is selection small
				if (rng.startContainer == rng.endContainer) {
					if (rng.startOffset - rng.endOffset < 2) {
						if (rng.startContainer.hasChildNodes())
							elm = rng.startContainer.childNodes[rng.startOffset];
					}
				}
			}

			// Get the element parent of the node
			elm = tinyMCE.getParentElement(elm);

			//if (tinyMCE.selectedElement != null && tinyMCE.selectedElement.nodeName.toLowerCase() == "img")
			//	elm = tinyMCE.selectedElement;
		}

		return elm;
	}
};
