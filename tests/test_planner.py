"""Semantic contract of the cumulative site's evening-planner section."""
from html.parser import HTMLParser
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class Elements(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.nodes = []
    def handle_starttag(self, tag, attrs):
        self.nodes.append((tag, dict(attrs)))

class PlannerMarkupTests(unittest.TestCase):
    def test_required_single_select_has_a_valid_placeholder_contract(self):
        doc = Elements()
        doc.feed((ROOT / 'index.html').read_text(encoding='utf-8'))
        index = next(i for i, (tag, attrs) in enumerate(doc.nodes)
                     if tag == 'select' and attrs.get('data-field') == 'duration')
        attrs = doc.nodes[index][1]
        first_option = next(a for tag, a in doc.nodes[index + 1:] if tag == 'option')
        if 'required' in attrs and 'multiple' not in attrs and int(attrs.get('size', '1')) <= 1:
            self.assertEqual(first_option.get('value'), '',
                             'A required single-select must begin with an empty-value placeholder')

    def test_planner_exposes_four_labelled_parameters_and_safe_static_fallback(self):
        doc = Elements()
        doc.feed((ROOT / 'index.html').read_text(encoding='utf-8'))
        roots = [a for tag, a in doc.nodes if tag == 'section' and 'data-evening-planner' in a]
        self.assertEqual(len(roots), 1, 'The cumulative page needs one evening-planner section')
        fields = {a['data-field']: (tag, a) for tag, a in doc.nodes if 'data-field' in a}
        for name in ('players', 'minutes', 'duration', 'breaks'):
            self.assertIn(name, fields)
            tag, attrs = fields[name]
            self.assertTrue(attrs.get('id'))
            self.assertTrue(any(t == 'label' and a.get('for') == attrs['id'] for t, a in doc.nodes))
            self.assertFalse(attrs.get('name'), 'Planner values are never form submission data')
        for name, low, high, default in [('players', '2', '12', '4'), ('minutes', '15', '240', '120')]:
            _, attrs = fields[name]
            self.assertEqual((attrs.get('type'), attrs.get('min'), attrs.get('max'), attrs.get('step'), attrs.get('value')), ('number', low, high, '1', default))
            self.assertIn('required', attrs)
        self.assertEqual(fields['duration'][0], 'select')
        self.assertEqual(fields['breaks'][1].get('type'), 'checkbox')
        self.assertTrue(any('data-planner-fallback' in a for _, a in doc.nodes))
        self.assertTrue(any('data-planner-results' in a and 'hidden' in a for _, a in doc.nodes))
        self.assertTrue(any('data-planner-reset' in a and a.get('type') == 'button' for _, a in doc.nodes))

    def test_duration_select_keeps_four_valid_choices_and_default_30(self):
        doc = Elements()
        doc.feed((ROOT / 'index.html').read_text(encoding='utf-8'))
        index = next(i for i, (tag, attrs) in enumerate(doc.nodes)
                     if tag == 'select' and attrs.get('data-field') == 'duration')
        options = doc.nodes[index + 1:index + 5]
        self.assertTrue(all(tag == 'option' for tag, _ in options))
        self.assertEqual([a.get('value') for _, a in options], ['15', '30', '45', '60'])
        self.assertEqual([a.get('value') for _, a in options if 'selected' in a], ['30'])
        self.assertNotEqual(doc.nodes[index + 5][0], 'option', 'Do not add a fifth placeholder choice')

class PlannerDistributionTests(unittest.TestCase):
    def test_planner_runtime_is_in_actual_packaged_distribution(self):
        import json
        import shutil
        import subprocess
        node = shutil.which('node')
        assert node is not None, 'Node.js is required for distribution tests'
        result = subprocess.run([node, 'scripts/package-dist.cjs'], cwd=ROOT,
                                capture_output=True, text=True, encoding='utf-8', check=True)
        files = {row['path'] for row in json.loads(result.stdout)['files']}
        self.assertIn('js/widget.js', files, 'The actual deployed package must include the planner runtime')
        self.assertEqual((ROOT / 'js/widget.js').read_bytes(), (ROOT / 'dist/js/widget.js').read_bytes())
        self.assertIn('./js/widget.js', (ROOT / 'dist/index.html').read_text(encoding='utf-8'))

if __name__ == '__main__':
    unittest.main()
