# TASKS

## Riferimenti pop (nomi carte)

- [x] **Red Stapler**: rinomina *Thrown Stapler* (`daggerThrow`)
- [x] **Metamorphosis**: rinomina *Retraining* (`polymorph`, Mago)
- [x] **Severance**: neutrale, toglie tutte le maledizioni da nastro e scarti e cura per ognuna
- [x] **Hide the Pain**: Guerriero, Blocco +1 ogni N HP mancanti
- [x] **Modern Times**: rinomina *Fast Forward* (`timeSlip`)
- [x] **Turn It Off** → aggiunge al mazzo **Turn It On** (coppia nuova, Mago/IT)
- [x] Rinomina carte esistenti adatte (o, al massimo, crea carte nuove):
  - [x] **sudo**: gioca ignorando le regole (No Repeats, Chill Out, Meticulous…) per qualche secondo (nuova?)
  - [x] **Ctrl+Z**: riporta sul nastro l'ultima carta uscita (nuova?)
  - [x] **Blue Screen**: rinomina *Glass Ceiling* (`shatter`)
  - [x] **Declare Bankruptcy**: rinomina *Tool Tornado* (`whirlwind`, la carta X)
  - [x] **Stonks**: rinomina *Crunch Time* (`rampage`)
  - [x] **Unlimited PTO**: Rigenerazione, ma sei stordito per qualche secondo

## Piccole fix
  - [x] Nella selezione dei personaggi, l'aura colorata dietro ad essi potrebbe essere un po' più grande e non tagliata orizzontalmente in cima.

  - [x] assicurati che la gestione della vibrazione sia fatta in modo corretto best practice; inoltre sfruttala leggermente di più, tipo al click di tasti importanti o durante azioni importanti del combattimento

  - [x] Nella mappa: lascia che si vedano i trattini in trasparenza sotto ai titoli dei nodi

  - [x] il cartellino "NEW" sui personaggi da provare non dovrebbe avere quell'effetto sfarfallio, mettigliene uno più fancy

  - [x] nuovo nemico "Office chair": dagli delle mosse molto meme

  - [x] nella schermata di game over (e di vittoria): il protagonista rovesciato è troppo piccolo, prima era più grande

  - [x] nella selezione personaggi: la scritta su come li si sblocca dovrebbe essere subito sotto al lucchetto; il tap sul lucchetto deve essere reattivo (vibrazione, suono di catene, animazione)

  - [x] onboarding: aggiungi anche un punto con icona di una lente d'ingrandimento in cui dici che per sapere cosa fanno carte, effetti o altro basta sempre fare long press

  - [x] warrior: rimuovigli proprio la carta once per run (lui è la classe più semplice, ci sta che non la abbia)


  - [x] in base al tempo che ci metti a battere un nemico, accumuli denaro (che non è altro che il tuo punteggio); mostra il denaro accumulato anche in alto nella mappa

  - [x] il nemico "toxic coworker" dovrebbe applicare veleno anziché danno

  - [x] l'animazione delle carte che fanno exhaust è troppo lenta, voglio che si rimpiccioliscano (oltre a bruciarsi) senza muoversi in altre direzioni

  - [x] battuto il boss dell'act 1 metti qualche animazione o scritta che mi introduca all'act 2 con più solennità, al momento atterro nella mappa di Act2 senza nulla

  - [x] long press su un nodo della mappa dovrebbe aprire popup con informazioni

  - [x] assicurati che long press funzioni ovunque per vedere informazioni su quella carta/effetto/stat: ad esempio nella selezione giocatore non funziona la long press sul deck (e neanche su il mana o sulla sleeve, dovrebbero aprirsi piccoli popup di spiegazione)

  - [x] in alcuni boss e negli elite: metti che assieme all'attacco hanno anche un +1 aggiungi Strength (così dei spronato a batterli velocemente)

- [ ]carta "quick sync" non dovrebbe costare zero ma 99

- [ ]rendi le icone degli status sia del nemico che propri più grandi, e allineale all'inizio della barra salute (stando rispettivamente sopra o sotto)

- [x] handbook: nel personnel come nelle carte segna quelli non ancora incontrati mettendogli il nome con tutti "????"

- [x] cambia sprite: rendi il goblin consultant pallido e col nasone e con i ricciolini e il sorriso malefico

- [ ] le sleeve mettile più centrali; inoltre rendi la hitbox più larga (così da poterci mettere carte al volo semplicemente trascinandole nell'area sotto)

- [ ] per il nemico the snitch (e per quelli simili in cui c'è un trigger per la loro passiva): quando scendi sotto il 50% dovrebbe comparire una scritta pioù grande, e dovrebbe esserci un suono


## Meccaniche nuove

- [ ] nuova carta **Overtime** (danno): il danno cresce ogni secondo che resta sul nastro
- [ ] cuova carta **Patience** (Blocco): massimo quando entra sul nastro, poi cala
- [ ] nuove **Carte con effetto bonus in sleeve**: una per eroe, con un effetto creativo che vale solo mentre sta nella sleeve
- Ogni carta: dati + i18n + art; numero sulla faccia aggiornato in tempo reale; test in `combat.test.ts`

## Home e splash (restyle totale)

- [ ] Nuova home + nuova schermata "Start game", direzione **H1 manifesto di propaganda**:
  - composizione diagonale costruttivista, CEO enorme tagliato dal bordo in due inchiostri, fasce di colore pieno
  - logo come titolo del manifesto su un blocco giallo, slogan timbrato
- [ ] Spunti da **H2 timbracartellino**: logo o CTA su un cartellino perforato; *New run* = cartellino che entra
  (KA-CHUNK); con una run in corso il cartellino mostra eroe, atto, piano e vita
- [ ] Spunti da **H3 ufficio del capo**: oggetti appoggiati su un piano (niente sprite che fluttuano), targa
  "PUNCHCARD INC."; il boss mostrato cambia con i progressi
- Controllo a 390×844 e 375×620
