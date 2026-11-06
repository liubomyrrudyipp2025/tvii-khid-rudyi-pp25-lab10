"""Portable contracts for the production deployment configuration."""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class CIContractTests(unittest.TestCase):
    def test_workflow_checks_before_project_scoped_production_deploy(self):
        path = ROOT / '.github' / 'workflows' / 'deploy.yml'
        self.assertTrue(path.is_file(), 'Version the real production workflow')
        text = path.read_text(encoding='utf-8')
        for command in ('npm ci', 'npm run format:check', 'npm run package:dist',
                        'npm test', 'node --test tests/validation.test.cjs tests/planner.test.cjs',
                        'vercel pull --yes --environment=production', 'vercel build --prod',
                        'vercel deploy --prebuilt --prod --yes'):
            self.assertIn(command, text)
        for expression in ('${{ secrets.VERCEL_TOKEN }}',
                           '${{ vars.VERCEL_ORG_ID }}', '${{ vars.VERCEL_PROJECT_ID }}'):
            self.assertIn(expression, text)
        self.assertNotIn('secrets.VERCEL_ORG_ID', text)
        self.assertNotIn('secrets.VERCEL_PROJECT_ID', text)
        self.assertNotIn('pull_request_target', text)
        self.assertNotIn('--token=', text)
        self.assertNotRegex(text, r'continue-on-error:\s*true')
        self.assertLess(text.index('npm test'),
                        text.index('vercel deploy --prebuilt --prod --yes'))

    def test_vercel_local_metadata_is_ignored(self):
        self.assertRegex((ROOT / '.gitignore').read_text(encoding='utf-8'),
                         r'(?m)^\.vercel/$')

    def test_vercel_versions_dist_only_actions_deployment(self):
        path = ROOT / 'vercel.json'
        self.assertTrue(path.is_file(), 'Version the dist-only Actions deployment policy')
        config = json.loads(path.read_text(encoding='utf-8'))
        self.assertIsNone(config['framework'])
        self.assertEqual(config['installCommand'], 'npm ci')
        self.assertEqual(config['buildCommand'], 'npm run package:dist')
        self.assertEqual(config['outputDirectory'], 'dist')
        self.assertIs(config['git']['deploymentEnabled'], False)
        clock = [item for item in config['headers']
                 if item['source'] == '/widgets/clock.shtml']
        self.assertEqual(len(clock), 1)
        self.assertIn({'key': 'Content-Type', 'value': 'text/html; charset=UTF-8'},
                      clock[0]['headers'])


if __name__ == '__main__':
    unittest.main()
