"""Exercise the actual allowlist packager, not a mocked manifest."""
from pathlib import Path
import json,shutil,subprocess,unittest
ROOT=Path(__file__).resolve().parents[1]
class FeedbackDistribution(unittest.TestCase):
    def test_feedback_runtime_is_in_the_packaged_distribution(self):
        node=shutil.which('node');assert node is not None,'Node.js is required for distribution tests'
        result=subprocess.run([node,'scripts/package-dist.cjs'],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',check=True)
        manifest=json.loads(result.stdout);paths={item['path'] for item in manifest['files']}
        self.assertIn('js/validation.js',paths,'Feedback validation must be present in the actual distribution')
        self.assertEqual((ROOT/'js/validation.js').read_bytes(),(ROOT/'dist/js/validation.js').read_bytes())
        self.assertIn('./js/validation.js',(ROOT/'dist/index.html').read_text(encoding='utf-8'))
    def test_media_runtime_is_in_packaged_distribution(self):
        node=shutil.which('node');assert node is not None
        result=subprocess.run([node,'scripts/package-dist.cjs'],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',check=True)
        paths={item['path'] for item in json.loads(result.stdout)['files']}
        for name in ['js/media-components.js','css/media-components.css']:
            self.assertIn(name,paths,'Missing media runtime in actual distribution')
            self.assertEqual((ROOT/name).read_bytes(),(ROOT/'dist'/name).read_bytes())
    def test_theme_runtime_and_credits_are_in_actual_distribution(self):
        node=shutil.which('node');assert node is not None
        result=subprocess.run([node,'scripts/package-dist.cjs'],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',check=True)
        paths={item['path'] for item in json.loads(result.stdout)['files']}
        for name in ['js/theme.js','CREDITS.md']:
            self.assertIn(name,paths,'New theme and third-party credits must not disappear in production')
            self.assertEqual((ROOT/name).read_bytes(),(ROOT/'dist'/name).read_bytes())
if __name__=='__main__':unittest.main()
