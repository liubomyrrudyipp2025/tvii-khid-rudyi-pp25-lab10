"""Cumulative source contracts; actual interaction tests run separately in Brave."""
from pathlib import Path
from html.parser import HTMLParser
import re
import unittest
ROOT = Path(__file__).resolve().parents[1]
class Tags(HTMLParser):
    def __init__(self):
        super().__init__(); self.nodes=[]; self.text=[]
    def handle_starttag(self, tag, attrs): self.nodes.append((tag,dict(attrs)))
    def handle_data(self, data): self.text.append(data)
def section(identifier):
    html=(ROOT/'index.html').read_text(encoding='utf-8')
    found=re.findall(r'<section\b[^>]*\bid="'+re.escape(identifier)+r'"[^>]*>(.*?)</section>',html,re.S)
    if len(found)!=1: raise AssertionError('Expected one section #'+identifier)
    tree=Tags();tree.feed(found[0]);return tree
class CumulativeContent(unittest.TestCase):
    def test_local_catalog_is_actively_wired_once_with_matching_ids(self):
        html=(ROOT/'index.html').read_text(encoding='utf-8')
        tree=Tags();tree.feed(html)
        scripts=[a for t,a in tree.nodes if t=='script' and a.get('src')=='./js/demo.js']
        self.assertEqual(len(scripts),1)
        self.assertIn('defer',scripts[0])
        cards=[a['data-demo-card'] for _,a in tree.nodes if 'data-demo-card' in a]
        buttons=[a for t,a in tree.nodes if t=='button' and 'data-demo-add' in a]
        self.assertEqual(sorted(cards),['1','2','3'])
        self.assertEqual(sorted(a['data-demo-add'] for a in buttons),sorted(cards))
        self.assertTrue(all(a.get('type')=='button' and a.get('aria-pressed')=='false' for a in buttons))
        search=[a for t,a in tree.nodes if t=='input' and 'data-demo-search' in a]
        self.assertEqual(len(search),1)
        self.assertEqual(search[0].get('type'),'search')
        self.assertEqual(sum(t=='label' and a.get('for')==search[0].get('id') for t,a in tree.nodes),1)
        self.assertEqual(sum('data-demo-status' in a and a.get('role')=='status' for _,a in tree.nodes),1)
        self.assertGreaterEqual(sum('data-cart-count' in a for _,a in tree.nodes),1)
    def test_copy_distinguishes_static_demo_examples_from_quiz_results(self):
        html=(ROOT/'index.html').read_text(encoding='utf-8')
        text=' '.join(re.sub('<[^>]+>',' ',html).split())
        self.assertNotIn('це єдина доступна взаємодія',text)
        self.assertIn('Окремі приклади нижче статичні',text)
        self.assertIn('Це не замовлення.',text)
    def test_header_and_footer_retain_legacy_and_feedback_shortcuts(self):
        html=(ROOT/'index.html').read_text(encoding='utf-8')
        tree=Tags();tree.feed(html)
        ids=[a['id'] for _,a in tree.nodes if 'id' in a]
        self.assertEqual(len(ids),len(set(ids)),'Duplicate IDs')
        for region in ['header','footer']:
            match=re.search(r'<'+region+r'\b[^>]*>(.*?)</'+region+'>',html,re.S)
            assert match is not None, 'Missing '+region
            fragment=match.group(1)
            nav=Tags();nav.feed(fragment)
            hrefs={a.get('href') for t,a in nav.nodes if t=='a'}
            for target in ['#about','#feedback','#contacts','#smart-select','#example']:
                self.assertIn(target,hrefs,region+' missing '+target)
        for _,attrs in tree.nodes:
            href=attrs.get('href','')
            if href.startswith('#'):
                self.assertIn(href[1:],ids,'Broken internal target '+href)
    def test_service_benefits_keep_native_unordered_list(self):
        tree=section('benefits')
        self.assertEqual(sum(t=='ul' for t,_ in tree.nodes),1)
        self.assertEqual(sum(t=='li' for t,_ in tree.nodes),4)
    def test_selection_steps_keep_native_ordered_list(self):
        tree=section('how-it-works')
        self.assertEqual(sum(t=='ol' for t,_ in tree.nodes),1)
        self.assertEqual(sum(t=='li' for t,_ in tree.nodes),3)
    def test_three_formats_retain_price_contents_and_terms_without_fake_prices(self):
        tree=section('plans')
        terms=[' '.join(x.split()) for x in tree.text if x.strip()]
        self.assertEqual(sum(t=='article' for t,_ in tree.nodes),3)
        self.assertIn('Разова покупка',terms)
        for field in ['Ціна','Склад бокса','Умови']:
            self.assertEqual(terms.count(field),3)
        self.assertGreaterEqual(terms.count('Потребує уточнення'),9)
    def test_smart_select_has_four_concept_actions_and_disabled_management(self):
        tree=section('smart-select');text=' '.join(' '.join(tree.text).split())
        for action in ['Заміна гри','Пропуск доставки','Призупинення','Скасування']:
            self.assertIn(action,text)
        buttons=[a for t,a in tree.nodes if t=='button']
        self.assertEqual(len(buttons),1)
        self.assertIn('disabled',buttons[0])
        self.assertIn('недоступне',text)
        self.assertIn('Потребує уточнення',text)
if __name__=='__main__':unittest.main()
