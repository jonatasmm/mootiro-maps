# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import simplejson

from django.db import models
from django.db.models import Q
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes import generic
from django.core.urlresolvers import reverse
from django.template.defaultfilters import slugify

from lib.taggit.managers import TaggableManager
from fileupload.models import UploadedFile
import reversion

from authentication.models import User
from community.models import Community
from search.signals import index_object_for_search
from main.utils import create_geojson


class ProjectRelatedObject(models.Model):
    project = models.ForeignKey('Project')

    # dynamic ref
    content_type = models.ForeignKey(ContentType, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = generic.GenericForeignKey('content_type', 'object_id')


class Project(models.Model):
    name = models.CharField(max_length=1024)
    slug = models.SlugField(max_length=1024)
    description = models.TextField()
    short_description = models.CharField(max_length=250, null=True, blank=True)

    tags = TaggableManager()

    contributors = models.ManyToManyField(User, null=True, blank=True,
            related_name='project_contributors')
    community = models.ManyToManyField(Community, null=True, blank=True)
    contact = models.TextField(null=True, blank=True)

    logo = models.ForeignKey(UploadedFile, null=True, blank=True)

    creator = models.ForeignKey(User, editable=False, null=True,
            related_name='created_projects')
    creation_date = models.DateTimeField(auto_now_add=True)
    last_editor = models.ForeignKey(User, editable=False, null=True,
            blank=True, related_name='project_last_editor')
    last_update = models.DateTimeField(auto_now=True)

    def __unicode__(self):
        return unicode(self.name)

    def slug_exists(self, slug):
        return Project.objects.filter(slug=slug).exists()

    def save(self, *a, **kw):
        self.slug = slugify(self.name)
        r = super(Project, self).save(*a, **kw)
        index_object_for_search.send(sender=self, obj=self)
        return r

    def partners_logo(self):
        """ pseudo-reverse query for retrieving the partners logo"""
        return UploadedFile.get_files_for(self)

    @property
    def all_contributors(self):
        c = [user for user in self.contributors.all()]
        if not self.creator in c:
            c.append(self.creator)
        return c

    @property
    def public(self):
        ''' Temporary property to avoid crashes. '''
        return True

    @property
    def public_discussion(self):
        ''' Temporary property to avoid crashes. '''
        return True

    def user_can_edit(self, user):
        return True

    def user_can_discuss(self, user):
        return True

    @property
    def home_url_params(self):
        return dict(id=self.id)

    @property
    def view_url(self):
        return reverse('project_view', kwargs=self.home_url_params)

    @property
    def edit_url(self):
        return reverse('project_edit', kwargs=self.home_url_params)

    @property
    def perm_id(self):
        return 'j%d' % self.id  # proJect, and not Proposal

    @property
    def logo_url(self):
        if self.logo:
            return self.logo.file.url
        else:
            return '/static/img/logo.png'

    @property
    def related_objects(self):
        """Returns a queryset for the objects for a given project"""
        return ProjectRelatedObject.objects.filter(project=self)

    def save_related_object(self, related_object, user=None, silent=False):
        ct = ContentType.objects.get_for_model(related_object)
        # Adds the object to project
        obj, created = ProjectRelatedObject.objects.get_or_create(
                content_type_id=ct.id, object_id=related_object.id,
                project_id=self.id)
        if user:
            # Adds user as contributor
            self.contributors.add(user)
            # Creates update entry
            if created and not silent:
                from update.models import Update
                from update.signals import create_update
                create_update.send(sender=obj.__class__, user=user,
                                    instance=obj, type=Update.EDIT)
        return created

    @property
    def related_items(self):
        items = self.all_contributors
        for obj in [o.content_object for o in self.related_objects]:
            items.append(obj)
        return items

    @property
    def json(self):
        return simplejson.dumps({
            'name': self.name,
            'slug': self.slug,
            'logo_url': self.logo_url,
            'view_url': self.view_url,
            'partners_logo': [{'url': logo.file.url}
                                for logo in self.partners_logo()]
        })

    @property
    def geojson(self):
        items = []
        for ro in self.related_objects:
            obj = ro.content_object
            if obj and not obj.is_empty():
                items.append(obj)
        return create_geojson(items)

    @classmethod
    def get_projects_for_contributor(cls, user):
        return Project.objects.filter(
            Q(contributors__in=[user]) | Q(creator=user)).distinct()


if not reversion.is_registered(Project):
    reversion.register(Project)

