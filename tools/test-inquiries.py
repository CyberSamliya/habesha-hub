"""Browser regression checks. Requires Python Playwright and system Chromium."""
import http.server, threading, functools
from pathlib import Path
from playwright.sync_api import sync_playwright
root = Path(__file__).resolve().parents[1]
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(root)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
try:
 with sync_playwright() as pw:
  browser = pw.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
  page = browser.new_page()
  errors=[]
  page.on('pageerror', lambda e: errors.append(str(e)))
  for route, kind in [('type=sponsorship','sponsorship'), ('type=digital','digital'), ('type=contact&name=City%20or%20Category%20Sponsor%20inquiry','sponsorship'), ('type=contact&name=Website%20and%20Digital%20Services%20inquiry','digital')]:
   page.goto(base+'/submission.html?'+route)
   assert page.locator('#intakeType').input_value()==kind
   assert page.locator('#intakeName').input_value()==''
   page.locator('#intakeState').select_option('Ohio')
   assert 'Columbus' in page.locator('#intakeCities option').evaluate_all('(els)=>els.map(e=>e.value)')
   page.locator('#intakeCity').fill('Columbus')
   page.locator('#intakeState').select_option('California')
   assert page.locator('#intakeCity').input_value()==''
   assert 'Columbus' not in page.locator('#intakeCities option').evaluate_all('(els)=>els.map(e=>e.value)')
   page.locator('#intakeCity').fill('My other city')
   page.locator('button[type=submit]').click()
   assert page.locator('#intakeReview').is_hidden()
   page.locator('#intakeName').fill('Test & Business')
   page.locator('#contactName').fill('Test Contact')
   page.locator('#contactEmail').fill('test@example.com')
   page.locator('#intakeDetails').fill('Project details & goals')
   if kind=='sponsorship':
    page.locator('#sponsorPlacement').select_option('category')
    page.locator('button[type=submit]').click()
    assert page.locator('#intakeReview').is_hidden()
    page.locator('#sponsorCategory').select_option('Restaurant')
   page.locator('button[type=submit]').click()
   assert page.locator('#intakeReview').is_visible()
   assert page.locator('#openPrivateForm').is_hidden()
   from urllib.parse import urlparse, parse_qs
   mail = page.locator('#emailInquiry').get_attribute('href')
   assert urlparse(mail).path=='advertise@habeshahubusa.com'
   assert parse_qs(urlparse(mail).query)['body'][0]==page.locator('#intakeSummary').input_value()
   assert 'Project details & goals' in page.locator('#intakeSummary').input_value()
   page.locator('#intakeDetails').fill('Changed')
   assert page.locator('#intakeReview').is_hidden()
   for width in [320,390,768,1280]:
    page.set_viewport_size({'width':width,'height':900})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  page.goto(base+'/submission.html?type=correction&id=test&state=Ohio&city=Columbus')
  assert page.locator('#intakeCity').input_value()=='Columbus'
  assert page.locator('#businessFields').is_hidden()
  page.locator('#intakeDetails').fill('Correction')
  page.locator('button[type=submit]').click()
  assert 'entry.1798896994=test' in page.locator('#openPrivateForm').get_attribute('href')
  assert page.locator('#emailInquiry').is_hidden()
  assert not errors, errors
  browser.close()
  print('PASS: dedicated and legacy routes, dependent cities, custom cities, validation, category requirements, email contents, stale-review protection, responsive widths, general submission regression, no JS errors')
finally:
 server.shutdown()
