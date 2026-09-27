# Punchcard

Deckbuilder roguelike **in tempo reale a nastro trasportatore**, per browser mobile in verticale.
Ispirato a *Cardstone* (Running Pillow, 2015). Stile ufficiale: **colori riso pop + pixel art, un po' dark/scary**.
Ambientazione: **un'avventura fantasy trattata come un lavoro in fabbrica**, con satira sociale (vedi sezione 1).

> Questo file è una panoramica del gioco. I valori precisi (vita, danni, costi, probabilità) vivono nei dati del
> codice. La parte tecnica (stack, architettura, convenzioni, come aggiungere contenuti) è in [CLAUDE.md](CLAUDE.md).

**Avvio rapido:** `npm install`, poi `npm run dev` (apribile anche dal telefono sulla stessa Wi-Fi).

---

## 1. Il gioco in breve

Scegli un eroe, timbra il cartellino e scendi piano per piano. Ogni combattimento è **in tempo reale**: le carte del
mazzo scorrono su un nastro da destra a sinistra e devi giocarle prima che cadano nel buio. Il mana si ricarica
col tempo, il nemico telegrafa le mosse. Tra un piano e l'altro migliori il mazzo scambiando carte.

### Ambientazione e tono

- **L'avventura è un lavoro.** Il nastro è una catena di montaggio: le carte arrivano e tu le "lavori" prima che
  finiscano negli scarti. Una run è una **giornata lavorativa**, e ogni atto è un **turno**: mattino, pomeriggio,
  notte. Il tono passa dal comico (il nuovo assunto nel turno del mattino) al dark (il turno di notte).
- **Satira sociale, un po' socialista**, che colpisce il sistema (dirigenti, burocrazia, il padrone) ma anche i
  colleghi: il collega tossico, la spia, il boomer anziano, il team leader.
- **Alto fantasy mischiato:** golem, automi, robot e steampunk convivono con goblin, scheletri e rospi.
- **Gli eroi restano eroi fantasy**, con appena un tocco di mansione nel titolo (es. *Shield of the Loading Dock*).
- **Nomi:** carte, nemici, mosse e maledizioni hanno nomi da posto di lavoro (*Punch*, *Hard Hat*, *Reply All*,
  *Deadline*); stati e parole chiave restano nomi di gioco (Poison, Burn, Block…) perché devono essere chiari.
  I testi del gioco sono in inglese.

### Cosa viene da Cardstone e cosa abbiamo cambiato

| Cardstone | Liverstone |
| --- | --- |
| Carte che scorrono "come i piattini del sushi" | Il **nastro**, a cadenza fissa: giocare veloce non fa pescare di più |
| Mana che si ricarica, carte che alzano il massimo | **Cristalli**: si parte con poco mana e si cresce durante lo scontro |
| Un nemico per piano con la sua velocità d'attacco | Attacco base lento e pesante + **mossa speciale** periodica, telegrafati |
| Scambio di una carta dopo ogni battaglia | **Ricompensa = sempre uno scambio** (il mazzo ha dimensione fissa) |
| "Manica" per tenere carte da parte | **Sleeve** con pochi slot, con dentro la carta speciale dell'eroe |
| Eroi con abilità | Eroi con passiva, abilità a mana e carta speciale una volta per run |
| Oro per sbloccare carte, timer "cibo" | Handbook (compendio) con scoperta delle carte; nessun timer di energia |

---

## 2. Regole del combattimento

- **Start:** lo scontro parte solo quando premi CLOCK IN. Prima (e durante) puoi **tenere premuto** qualunque cosa per
  leggerla: carte, stati, abilità, ritratto (passiva), barra minaccia, mana. Prima di iniziare, sopra al nemico compaiono le sue abilità passive.
- **Nastro:** tocca una carta per giocarla, trascinala in su verso il nemico per giocarla, trascinala in giù
  nella sleeve per tenerla. Una carta che esce a sinistra finisce negli scarti (le maledizioni *volatili*
  lampeggiano poco prima, poi esplodono o ti puniscono). Quando il mazzo finisce, gli scarti si rimescolano. Alcune carte danno **Rush**:
  il nastro accelera e le carte arrivano prima (compare tra i tuoi stati, con il tempo rimasto).
- **Mana:** si ricarica col tempo, a un ritmo che dipende dall'eroe. Il massimo parte basso e cresce con le
  carte **cristallo**, che valgono una volta per scontro (con *Fast Track* arrivano per prime). Icone coerenti ovunque:
  **gemma piena = mana** da spendere (es. da 1/3 a 3/3), **gemma vuota = cristallo** che alza il massimo e si
  riempie col tempo (es. da 3/3 a 3/5).
- **Nemici:** un **attacco base** lento e pesante e, a intervalli, una **mossa speciale** (colpo ancora più forte,
  maledizioni, furto, blocco); gli speciali si alternano. Ogni colpo è un momento da preparare, con respiro in mezzo. La **barra minaccia** sopra il nastro mostra la mossa,
  il valore, il caricamento e quanto manca al prossimo speciale; tenendola premuta si vede tutto lo schema d'attacco del nemico.
- **Difesa:** il **Blocco** assorbe i danni ma svanisce col tempo, quindi va giocato poco prima del colpo. La
  barra vita mostra a strisce quanto perderai.
  Poco prima di ogni colpo c'è un segnale sonoro (diverso se il Blocco lo copre) e, se non è bloccato, i bordi lampeggiano.
- **Abilità dell'eroe:** mossa potente che costa 6 mana, quindi va usata dopo aver fatto crescere i cristalli.
- **Carta speciale:** una per eroe, parte nella sleeve a ogni scontro, si usa **una volta per run**.
- **Stati:** Forza, Blocco, Veleno, Bruciatura, Congelamento, Stordimento, Debole, Vulnerabile, Schivata, Parata,
  Fortificato e altri legati agli eroi. Tieni premuto uno stato per leggerlo.

### La run

- **Atto 1 – The Morning Shift (turno del mattino):** una mappa a **due percorsi** che partono da un primo lavoro
  comune, un paio di volte sono collegati (in diagonale o in orizzontale, senza mai incrociarsi) e si ricongiungono
  al **boss**. Lungo la strada: lavori (battaglie), sale pausa,
  **promozioni** e un'**ispezione** (élite). Dopo ogni tappa scegli dove andare.
  La run è già modellata come grafo, pronta per una mappa a rami.
- **Ricompensa:** sopra tutto il mazzo, sotto alcune carte premio: scegli una carta per parte e **Scambia**, oppure
  **Salta**. Le élite danno carte più rare.
- **Sala pausa (Break Room):** *Nap* cura una parte della vita, *Training* **potenzia** una carta (selezioni, vedi
  l'anteprima, confermi).
- **Promotion:** scegli un vantaggio permanente per una carta del mazzo: *Fast Track* (Innate: arriva tra le prime
  sul nastro) o *Budget Cut* (costa 1 mana in meno).
- **Salvataggio** a ogni piano. Dalla pausa: *Main menu* (la run resta, lo scontro riparte) o *Call in sick*
  (abbandona la run).

---

## 3. Eroi

| | Guerriero (*Shield of the Loading Dock*) | Mago (*Keeper of the Furnace*) | Negromante (*Shop Steward of the Dead*) |
| --- | --- | --- | --- |
| Mestiere | *Welder* | *Stoker* | *Socialist* |
| Archetipo | Blocco e attacchi pesanti | Catene di incantesimi, gelo, fuoco | Veleno |
| Passiva | **Thick Skin**: il Blocco svanisce più lentamente | **Multitasking**: gli incantesimi in catena diventano più forti | **Virulence**: con 6+ Veleno sul nemico, il Veleno fa più danno |
| Abilità | **Overtime**: attacchi potenziati per qualche secondo | **Time Theft**: congela il nemico e accelera il nastro | **General Strike**: raddoppia il Veleno sul nemico |
| Sleeve | 1 slot (ha perso un braccio sul lavoro) | 2 slot | 3 slot |
| Speciale | **Picket Line**: Blocco e Forza | **Boiler Burst**: danno enorme e Bruciatura | **Wildcat Strike**: cura e Veleno |

I mazzi iniziali hanno 9 carte, solo carte base e cristalli; tutte le altre arrivano come ricompensa.

---

## 4. Carte

- **Rarità:** iniziale, comune, rara, epica, leggendaria, più la speciale dell'eroe e le maledizioni.
- **Set:** 24 carte per ogni eroe (attorno al suo archetipo, speciale inclusa), 9 **neutrali** giocabili da tutti
  (kit di pronto soccorso, energy drink, *Coffee Break*, cristalli *Coffee* e *Double Espresso*, utilità) e 9 **maledizioni**.
- **Faccia:** le carte mostrano **icone e numeri grandi**; il testo completo e il glossario si leggono tenendo
  premuto. Una condizione è tra parentesi (es. un attacco che fa più danni se hai Blocco).
- **Potenziamento:** ogni carta ha una versione migliorata, ottenibile in sala pausa (*Training*).
- **Maledizioni:** date dai nemici, durano solo lo scontro: *Drama* intasa il nastro, *Write-Up* ti ferisce,
  *Deadline* esplode, *Mandatory Fun* ruba mana, *Gossip* avvelena, *Improvement Plan* ti indebolisce e
  *Red Tape* ti rende Vulnerabile se le lasci uscire; *Quick Sync* (una riunione) occupa il nastro e non si può togliere. *Gatekeeping* è larga
  tre carte e copre quelle davanti. Alcuni nemici maledicono invece le tue carte (*pietrificate*: toccale finché si rompono).
- **Parole chiave:** Innate (arriva per prima), Esaurisci (una volta per scontro), Consuma (sparisce dal mazzo),
  Fugace (sparisce se esce dal nastro), Volatile (effetto all'uscita), Rush (accelera il nastro), Potere (dura
  tutto lo scontro), X (spende tutto il mana).

---

## 5. Nemici (Atto 1)

| Nemico | Stile |
| --- | --- |
| The Snitch | La spia: colpi rapidi e raffiche (*Rat Out*) |
| Senior Boomer | Colpi lenti, un colpo pesantissimo (*Seniority*) e *Gatekeep*: due maledizioni larghe tre carte che coprono le carte davanti a sé sul nastro finché non le paghi (2 mana l'una) |
| Toxic Coworker | Il collega tossico: riempie il nastro di *Drama* e il mazzo di *Gossip* |
| Team Leader | *Team Building* lo rende più forte e ti rifila *Mandatory Fun*; *Let's Sync* ti mette due riunioni sul nastro |
| Goblin Consultant | Ruba carte (*Outsource*) e ti mette *Deadline* sul nastro |
| HR Bitch | Passiva *No Repeats Policy*: non puoi giocare due carte dello stesso tipo a meno di 3 s l'una dall'altra; *Performance Review* ti mette due *Improvement Plan* nel mazzo |
| Guy Asleep | Un solo colpo enorme con una miccia lunghissima (*Rude Awakening*), ma ogni carta che giochi lo sveglia 1 s prima |
| New Hire | *Blank Stare* pietrifica tutte le carte sul nastro e le prossime 3 del mazzo: su ognuna c'è scritto *Tap it! ×5*; restano di pietra (anche rimescolate nel mazzo) finché non le rompi |
| **Security Automaton** (élite) | Colpi che rendono Vulnerabile, *Lockdown* (blocco), *Clearance Check* (due *Red Tape* nel mazzo), si infuria a metà vita |
| **Slaves CEO** (boss) | *Write-Ups*, *Deadlines* e il colpo *YOU'RE FIRED*; a metà vita accelera |

La difficoltà cresce scendendo di piano.

---

## 6. Schermate e interfaccia

- **Home:** logo animato, boss tra oggetti d'ufficio e di fabbrica (timbracartellino, schedario, sacco di soldi, barile tossico); *Clock in* (nuova run) / *Back to work* (continua), *Handbook*,
  *How to play* (apre l'Onboarding), Impostazioni.
- **Scelta eroe:** carosello orizzontale "da videogioco" (eroe grande sul piedistallo, frecce e indicatori).
- **Percorso:** in alto ritratto dell'eroe (toccalo o tienilo premuto per la sua scheda), vita e mazzo; sotto la mappa dei piani dell'atto con icone (lavoro, sala pausa, ispezione e boss un po' più grandi) e il tasto
  per entrare nel piano. La run si abbandona dalla pausa in combattimento o iniziandone una nuova.
- **Combattimento**, dall'alto: barra superiore (nome del nemico in grande e piano, velocità di gioco, pausa) · nemico con stati e vita ·
  barra minaccia · eroe (ritratto, vita, Blocco, stati) · **nastro** · mana · sleeve e abilità (i contatori di mazzo e scarti sono nascosti). Vita del nemico,
  mossa in arrivo e vita dell'eroe stanno tutte subito sopra il nastro, così non serve distogliere lo sguardo dalle carte.
- **Ricompensa, sala pausa** (macchinetta del caffè steampunk, con animazione di cura), **fine turno e licenziamento** (statistiche), **Handbook** (carte per
  classe con scoperte, nemici con mosse).
- **Impostazioni:** musica, effetti, velocità, riduci animazioni, vibrazione, nastro da sinistra a destra (test; vale dal combattimento successivo). Tutti i testi sono pronti per altre lingue.

## 7. Direzione artistica e audio

- **Riso pop + pixel, un po' dark:** notte viola retinata; carte, bottoni ed etichette come stampe su carta
  con ombre nette sfalsate. Quattro inchiostri: rosa fluo, blu, giallo, inchiostro scuro (+ sovrastampe).
- **Mai:** sfumature per l'ombreggiatura, glow, finto 3D, cerchi decorativi di sfondo.
- **Fabbrica con misura:** l'atto 1 è una fabbrica dentro la cripta (ossa, candele, pietra, qualche dettaglio di
  ottone, cartellini e pergamene timbrate); ingranaggi, caldaie e automi crescono nei turni successivi.
- **Pixel art** generata dai disegni vettoriali all'avvio: livelli d'inchiostro, retino a puntini, contorno.
- **Animazioni a scatti** (tranne le finestre, fluide); colpi con flash invertito; danni come "-N" su macchia di sangue,
  al centro del nemico e abbastanza lenti da leggerli.
- **Colori delle carte:** banda del nome = classe (rosa Guerriero, blu Mago, verde Negromante, giallo neutre,
  nero maledizioni); illustrazione = categoria (rosa attacco, blu difesa, giallo utilità, verde maledizione);
  gemma a rombo solo per rare (blu), epiche (rosa) e leggendarie (gialla).
- **Font:** Silkscreen per le parole dei titoli, Jersey 10 per interfaccia e numeri, Space Grotesk per i testi lunghi.
- **Musica chiptune procedurale:** menu (carillon), combattimento, élite (marcia cupa), boss, falò, pausa (calma),
  vittoria. Effetti sonori sintetizzati, vibrazione sui colpi.
