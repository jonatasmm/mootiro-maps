# -*- coding: utf-8 -*-
from django import forms
from django.utils.translation import ugettext_lazy as _


class PluploadWidget(forms.Widget):
    """Plupload widget"""
    class Media:
        js = (
            'plupload/browserplus-min.js',
            'plupload/js/plupload.full.js',
            'plupload/js/jquery.plupload.queue/jquery.plupload.queue.js',
            'plupload/komoo_plupload.js',
            'plupload/js/i18n/pt-br.js',
        )
        css = {
            'all': ('plupload/komoo_plupload.css',)
        }

    def render(self, name, value=None, attrs=None):
        html = u"""
            <div id="uploader">
                <p>You browser doesn't have Flash, Silverlight, Gears, BrowserPlus or HTML5 support.</p>
            </div>
            <div>
                <input type="hidden" id="id_files_ids_list" name="%(name)s" >
            </div>

            <div id="files-list"></div>
        """ % {'name': name}
        return html


class FileuploadWidget(forms.Widget):
    class Media:
        js = (
            'plupload/browserplus-min.js',
            'plupload/js/plupload.full.js',
            'plupload/komoo_plupload.js',
            'lib/bootstrap-modal.js',
        )
        css = {
            'all': ('plupload/komoo_plupload.css',)
        }

    def render(self, name, value=None, attrs=None):
        html = u"""

        <div id="uploader">
            <div>
                <a id="pickfiles" href="#" class="button">%(select_files)s</a>

                <a class="btn" data-toggle="modal" href="#file-modal" >
                    %(add_links)s
                </a>
                <div class="modal hide file-modal" id="file-modal">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal">×</button>
                        <h3>%(add_img_links)s</h3>
                    </div>
                    <div class="modal-body">
                        <p>
                            <div class="inline-block file-link-list">
                                <div class="add-new-file-link btn">+</div>
                                <input type="text" class="file-link" name='file_link'>
                            </div>
                        </p>
                    </div>
                    <div class="modal-footer">
                        <a href="#" class="btn" data-dismiss="modal">
                            %(close)s
                        </a>
                        <a href="#" class="button" id="add_files_from_links">
                            %(save_changes)s
                        </a>
                    </div>
                </div>
            </div>

            <div id="filelist"></div>

            <div>
                <input type="hidden" id="id_files_ids_list" name="%(name)s" >
            </div>

        </div>
        """ % {
            'select_files': _('Select Files'),
            'add_links': _('Add Links'),
            'add_img_links': _('Add Image Links'),
            'close': _('Close'),
            'save_changes': _('Save Changes'),
            'name': name
        }
        return html


class FileuploadField(forms.CharField):
    widget = FileuploadWidget


class POCForm(forms.Form):
    files = FileuploadField()
    title = forms.CharField()
