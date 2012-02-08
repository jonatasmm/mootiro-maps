#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import unicode_literals  # unicode by default

from django import forms
from django.forms.widgets import flatatt
from django.utils.html import escape
from django.utils.simplejson import JSONEncoder


class JQueryAutoComplete(forms.TextInput):
    def __init__(self, source, value_field=None, options={}, attrs={}):
        """source can be a list containing the autocomplete values or a
        string containing the url used for the XHR request.

        For available options see the autocomplete sample page::
        http://jquery.bassistance.de/autocomplete/"""

        self.value_field = value_field
        self.options = options
        self.attrs = {'autocomplete': 'off'}
        self.source = source

        self.attrs.update(attrs)

    def render_js(self, label_id, value_id):
        if isinstance(self.source, list):
            source = JSONEncoder().encode(self.source)
        elif isinstance(self.source, basestring):
            source = "%s" % escape(self.source)
        else:
            print type(self.source)
            raise ValueError('source type is not valid')

        js = u"""
        $("#%(label_id)s").autocomplete({
            source: "%(source)s",
            focus: function(event, ui) {
                $("#%(label_id)s").val(ui.item.label);
                return false;
            },
            select: function(event, ui) {
                $("#%(label_id)s").val(ui.item.label);
                $("#%(value_id)s").val(ui.item.value);
                return false;
            }
        });
        """ % {
            'source': source,
            'label_id': label_id,
            'value_id': value_id
        }

        return js

    def render(self, name, value=None, attrs=None):
        final_attrs = self.build_attrs(attrs, name=name)
        if value:
            final_attrs['value'] = escape(unicode(value))

        if not 'id' in self.attrs:
            final_attrs['id'] = 'id_%s' % name

        return u'''<input type="text" %(attrs)s/>
        <script type="text/javascript"><!--//
        %(js)s//--></script>
        ''' % {
            'name': name,
            'attrs': flatatt(final_attrs),
            'js': self.render_js(final_attrs['id'], "id_%s" % self.value_field),
        }


class Tagsinput(forms.TextInput):
    """Widget for using JQuery Tags Input Plugin by xoxco.com
    See http://xoxco.com/projects/code/tagsinput/
    """

    class Media:
        css = {'all': ('lib/tagsinput/jquery.tagsinput.css',)}
        js = ('lib/tagsinput/jquery.tagsinput.min.js',)

        
    def __init__(self, autocomplete_url="", options={}, attrs={}):
        self.autocomplete_url = autocomplete_url
        self.options = options
        self.attrs = attrs

    def render_js(self, elem_id):
        if self.autocomplete_url:
            options_str = "{autocomplete_url: '%s'}" % self.autocomplete_url
        else:
            options_str = ""

        js = u"""
        $('#%(elem_id)s').tagsInput(%(options)s);
        """ % {
            'elem_id': elem_id,
            'options': options_str,
        }
        return js

    def render(self, name, value=None, attrs=None):
        final_attrs = self.build_attrs(attrs, name=name)

        if not 'id' in self.attrs:
            final_attrs['id'] = 'id_%s' % name

        html = u"""
        <input %(attrs)s"/>
        <script type="text/javascript"><!--//
          %(js)s
        //--></script>
        """ % {
            'name': name,
            'attrs': flatatt(final_attrs),
            'js': self.render_js(final_attrs['id'])
        }

        return html
