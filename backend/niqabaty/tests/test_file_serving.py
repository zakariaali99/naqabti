import shutil
import tempfile
from pathlib import Path

from django.test import TestCase, override_settings

STATIC_DIR = tempfile.mkdtemp()
MEDIA_DIR = tempfile.mkdtemp()


@override_settings(DEBUG=False, STATIC_ROOT=STATIC_DIR, MEDIA_ROOT=MEDIA_DIR)
class FileServingWithoutDebugTests(TestCase):
    """The host has no static file server, so Django serves these with DEBUG off."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        Path(STATIC_DIR, 'app.js').write_text('console.log(1)')
        Path(MEDIA_DIR, 'profiles').mkdir(exist_ok=True)
        Path(MEDIA_DIR, 'profiles', 'a.png').write_bytes(b'png')

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(STATIC_DIR, ignore_errors=True)
        shutil.rmtree(MEDIA_DIR, ignore_errors=True)
        super().tearDownClass()

    def test_assets_are_served(self):
        self.assertEqual(self.client.get('/assets/app.js').status_code, 200)

    def test_media_is_served(self):
        self.assertEqual(self.client.get('/media/profiles/a.png').status_code, 200)

    def test_paths_outside_the_folder_are_refused(self):
        self.assertIn(self.client.get('/media/../manage.py').status_code, (400, 404))
