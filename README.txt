ŚLĄSKA KUŹNIA MŁODYCH PRZEDSIĘBIORCÓW — WDROŻENIE

1. Wgraj całą zawartość tego folderu na hosting z obsługą PHP 8+.
2. Folder api/data musi mieć prawo zapisu dla PHP (zwykle 750 lub 770).
3. W api/register.php wpisz docelowy adres organizatora w zmiennej $organizerEmail.
4. Uzupełnij i zatwierdź treść polityka-prywatnosci.html przed publicznym uruchomieniem zapisów.
5. Domena strony jest ustawiona jako kuzniamlodych.pl w index.html, wydarzenie.ics i assets/js/main.js.
6. Serwer powinien mieć poprawnie skonfigurowaną funkcję PHP mail(). Jeśli jej nie ma, podłącz SMTP/Brevo/MailerLite w api/register.php.
7. Panelistów i partnerów edytujesz bezpośrednio w index.html. Główne dane wydarzenia są oznaczone także w EVENT_CONFIG w assets/js/main.js.
8. Po wydarzeniu zmień mode: 'before' na mode: 'after' w assets/js/main.js.

Pliki można wgrać przez FTP — nie wymagają Node.js, npm ani procesu budowania.

