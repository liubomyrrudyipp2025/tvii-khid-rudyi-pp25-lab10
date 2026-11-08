"""Focused contracts for the explicitly requested browser-local demo expansion."""
from pathlib import Path
from html.parser import HTMLParser
import unittest
ROOT = Path(__file__).resolve().parents[1]
class Nodes(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.nodes = []; self.feed(text)
    def handle_starttag(self, tag, attrs): self.nodes.append((tag, dict(attrs)))
class DemoServiceTests(unittest.TestCase):
    def test_three_pages_have_unique_ids_and_valid_local_navigation(self):
        for name in ('index.html', 'account.html', 'quiz.html'):
            text = (ROOT / name).read_text(encoding='utf-8'); nodes = Nodes(text).nodes
            ids = [a['id'] for _, a in nodes if 'id' in a]
            self.assertEqual(len(ids), len(set(ids)), name)
            for tag, attrs in nodes:
                if tag != 'a': continue
                href = attrs.get('href', '')
                if href.startswith('#'): self.assertIn(href[1:], ids, name)
                elif href.startswith('./'):
                    path, _, fragment = href[2:].partition('#')
                    target = ROOT / path; self.assertTrue(target.is_file(), href)
                    if fragment:
                        target_ids = [a.get('id') for _, a in Nodes(target.read_text(encoding='utf-8')).nodes]
                        self.assertIn(fragment, target_ids, href)
            self.assertIn('./js/demo-service.js', text)
            self.assertIn('site-header', text)
    def test_five_question_quiz_and_optional_guest_registration(self):
        for name in ('index.html', 'quiz.html'):
            text = (ROOT / name).read_text(encoding='utf-8'); nodes = Nodes(text).nodes
            self.assertEqual(sum('data-quiz-step' in a for _, a in nodes), 5)
            self.assertEqual(sum('data-full-quiz' in a for _, a in nodes), 1)
            self.assertIn('Реєстрація необов’язкова', text)
            self.assertIn('data-quiz-restart', text)
    def test_demo_requires_no_password_payment_or_server_submission(self):
        text = (ROOT / 'account.html').read_text(encoding='utf-8')
        nodes = Nodes(text).nodes
        self.assertFalse(any(a.get('type') == 'password' for _, a in nodes))
        for flag in ('data-register-form', 'data-login-form', 'data-enroll-form', 'data-sub-replace', 'data-sub-skip', 'data-sub-pause', 'data-sub-cancel'):
            self.assertTrue(any(flag in a for _, a in nodes), flag)
        js = (ROOT / 'js/demo-service.js').read_text(encoding='utf-8')
        for forbidden in ('fetch(', 'XMLHttpRequest', 'innerHTML', 'localStorage.clear(', 'eval('): self.assertNotIn(forbidden, js)
        self.assertIn('tvii-khid-demo-service-v1', js)
        self.assertIn('textContent', js)
        pack = (ROOT / 'scripts/package-dist.cjs').read_text(encoding='utf-8')
        for name in ('account.html', 'quiz.html', 'css/demo-service.css', 'js/demo-service.js'): self.assertIn('"' + name + '"', pack)
if __name__ == '__main__': unittest.main()
