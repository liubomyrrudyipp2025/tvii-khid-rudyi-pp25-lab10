"""Lab9 HTML contract tests: real source, without DOM mocks."""
from pathlib import Path
from html.parser import HTMLParser
import unittest
ROOT=Path(__file__).resolve().parents[1]
class Tree(HTMLParser):
    def __init__(self):super().__init__();self.nodes=[]
    def handle_starttag(self,tag,attrs):self.nodes.append((tag,dict(attrs)))
class FeedbackSemantics(unittest.TestCase):
    def test_required_feedback_controls_have_explicit_labels(self):
        tree=Tree();tree.feed((ROOT/'index.html').read_text(encoding='utf-8'))
        forms=[a for tag,a in tree.nodes if tag=='form' and a.get('id')=='feedbackForm']
        self.assertEqual(len(forms),1,'A separate feedback form must exist')
        ids={'username':('input','text'),'email':('input','email'),'phone':('input','tel'),'message':('textarea',None),'agreement':('input','checkbox')}
        for field,(tag,kind) in ids.items():
            with self.subTest(field=field):
                found=[a for t,a in tree.nodes if t==tag and a.get('id')==field]
                self.assertEqual(len(found),1)
                attrs=found[0];self.assertEqual(attrs.get('name'),field)
                self.assertIn('required',attrs)
                if kind:self.assertEqual(attrs.get('type'),kind)
                self.assertTrue(any(t=='label' and a.get('for')==field for t,a in tree.nodes))
                descriptions=attrs.get('aria-describedby','').split();self.assertTrue(descriptions)
                for desc in descriptions:self.assertEqual(sum(a.get('id')==desc for _,a in tree.nodes),1)
        self.assertTrue(any(tag=='button' and a.get('type')=='submit' for tag,a in tree.nodes))
class ProjectIdentity(unittest.TestCase):
    def test_cumulative_workspace_keeps_historical_package_identity_and_port(self):
        import json
        package=json.loads((ROOT/'package.json').read_text(encoding='utf-8'))
        lock=json.loads((ROOT/'package-lock.json').read_text(encoding='utf-8'))
        settings=json.loads((ROOT/'.vscode/settings.json').read_text(encoding='utf-8'))
        self.assertEqual(package['name'],'tvii-khid-lab10-media','Preserve historical package identity for the cumulative site')
        self.assertEqual(lock['name'],package['name'])
        self.assertEqual(lock['packages']['']['name'],package['name'])
        self.assertEqual(settings['liveServer.settings.port'],5510)
        readme=(ROOT/'README.md').read_text(encoding='utf-8')
        self.assertEqual(readme.splitlines()[0],'# Твій Хід — накопичувальний навчальний сайт')
        self.assertIn('Планувальник ігрового вечора (ЛР11)',readme)
        self.assertIn('tests/planner.test.cjs',readme)
        tasks=json.loads((ROOT/'.vscode/tasks.json').read_text(encoding='utf-8'))['tasks']
        self.assertTrue(tasks)
        self.assertTrue(all('Lab10' in t['label'] and 'Lab9' not in t['label'] for t in tasks),'Task labels still identify the previous lab')
        self.assertTrue(any('git status' in t['command'] and 'git log' in t['command'] for t in tasks),'Use real Git commands, not terminal illustrations')
if __name__=='__main__':unittest.main()
