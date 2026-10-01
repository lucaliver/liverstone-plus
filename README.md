# Punchcard

Deckbuilder roguelike **in tempo reale a nastro trasportatore**, per browser mobile in verticale.
Ispirato a *Cardstone* (Running Pillow, 2015). **Un'avventura fantasy trattata come un lavoro in fabbrica**, con satira sociale.

> Panoramica del gioco, senza numeri né elenchi di contenuti (vivono nei dati del codice e cambiano a ogni patch).
> La parte tecnica è in [CLAUDE.md](CLAUDE.md).

**Avvio rapido:** `npm install`, poi `npm run dev` (apribile anche dal telefono sulla stessa Wi-Fi).

---

## 1. Il gioco in breve

Scegli un eroe, timbra il cartellino e scendi piano per piano. Ogni scontro è **in tempo reale**: le carte del mazzo
scorrono su un nastro e vanno giocate prima che cadano nel buio. Il mana si ricarica col tempo, il nemico telegrafa le
mosse. Tra uno scontro e l'altro migliori il mazzo.

### Ambientazione e tono

- **L'avventura è un lavoro.** Una run è una **giornata lavorativa**, ogni atto un **turno** (mattino, pomeriggio, notte):
  il tono passa dal comico al dark.
- **Satira sociale** che colpisce il sistema (dirigenti, burocrazia) e i colleghi (il tossico, la spia, il boomer).
- **Fantasy mischiato:** golem, automi e steampunk convivono con goblin, scheletri e rospi.
- **Eroi fantasy**, con appena un tocco di mansione.
- **Nomi da ufficio** per carte, nemici, mosse e maledizioni; stati e parole chiave restano nomi di gioco (Poison, Block…).
  Testi in inglese, pronti per altre lingue.

### Cosa abbiamo cambiato rispetto a Cardstone

| Cardstone | Punchcard |
| --- | --- |
| Carte che scorrono "come i piattini del sushi" | Un **nastro** a cadenza fissa: giocare veloce non fa pescare di più |
| Mana che cresce | **Cristalli**: si parte con poco mana e si cresce durante lo scontro |
| Un nemico con la sua velocità d'attacco | Attacco base lento e pesante + **mossa speciale** periodica, sempre telegrafati |
| Scambio di una carta dopo ogni battaglia | **Ricompensa = sempre uno scambio**: il mazzo ha dimensione fissa |
| "Manica" per tenere carte da parte | **Sleeve** con pochi slot |
| Oro e timer "cibo" | Nessun timer di energia; compendio con scoperta dei contenuti |

---

## 2. Regole

### Combattimento

- **Clock in:** lo scontro parte solo quando lo avvii. Prima e durante puoi **tenere premuto** qualsiasi cosa per leggerla.
- **Nastro:** tocca una carta per giocarla, trascinala nella sleeve per tenerla. Una carta che cade dal fondo finisce negli
  scarti; finito il mazzo, gli scarti si rimescolano.
- **Mana:** si ricarica col tempo. Il massimo parte basso e cresce con le carte **cristallo**.
- **Nemici:** un attacco base e, a intervalli, una mossa speciale. La **barra minaccia** mostra la mossa in carica.
- **Difesa:** il **Blocco** assorbe i danni ma svanisce col tempo, quindi va giocato poco prima del colpo.
- **Abilità dell'eroe:** una mossa potente a mana alto.
- **Regole dei nemici:** passive e maledizioni cambiano il modo di giocare (carte bloccate, nastro rallentato o ruotato…).
- **Stati e parole chiave** si leggono tenendoli premuti. Il manuale (*How to play*, *Handbook*) spiega come leggere una carta.

### La run

- **Atti:** ogni atto è una mappa a **due percorsi** disegnata come pianta d'ufficio, che si ricongiungono nel **boss**.
  Battuto il boss, ci si cura e si passa al turno successivo. Tre atti: il turno del mattino, quello del pomeriggio e il
  **turno di notte**, con l'orologio che arriva fino all'alba e il consiglio di amministrazione come boss finale.
- **Stanze:** lavori (scontri), élite (ispezioni), **sala pausa** (cura o potenziamento), **promozioni** (vantaggi permanenti
  per una carta), **sala fotocopie** (distruggi o duplica una carta), **sartoria** (un relic che
  aggiunge uno slot manica, oppure più vita massima), **oggetti smarriti** (scegli uno tra tre relic),
  **distributore automatico** (una carta rara o epica a caso, pagata in vita), **formazione incrociata** (scegli una tra quattro
  carte delle altre classi, due per classe). I **relic** sono oggetti con un effetto permanente per la run.
- **Ricompensa:** scegli una carta e **scambiala** con una del mazzo, oppure **salta** per un po' di vita massima. Élite e boss
  danno carte più rare.
- **Paga:** ogni scontro vinto paga, di più se in fretta. È il punteggio della run, mostrato nella busta paga finale.
- **Salvataggio** a ogni piano. Dalla pausa: *Main menu* (la run resta) o *Call in sick* (abbandona).
- **Prima run guidata:** mappa e nemici fissi, con un tour del primo scontro.

---

## 3. Eroi

| | Guerriero | Mago | Negromante |
| --- | --- | --- | --- |
| Mestiere | Ha perso un braccio all'ora di punta | Il tecnico I.T. che sa la tua password | Leader di un culto sindacale |
| Archetipo | Blocco e attacchi pesanti | Catene di incantesimi, gelo, fuoco | Veleno |
| Sblocco | Subito | Finisci una run col Guerriero | Arriva al boss dell'Atto 1 |

Ognuno ha una passiva, un'abilità a mana e un numero diverso di slot sleeve. I mazzi iniziali hanno solo carte base e
cristalli; il resto arriva come ricompensa.

## 4. Contenuti

- **Carte:** un set per eroe, **neutrali** per tutti, **maledizioni** date dai nemici (durano lo scontro). Cinque rarità; ogni
  carta ha una versione potenziata. Alcune cambiano mentre viaggiano sul nastro, altre vivono nella sleeve, altre ancora
  chiedono un gesto (trascinare, tenere premuto).
- **Nemici:** normali, élite e boss per atto, ognuno con una trovata (passiva, maledizione o meccanica del nastro).
  La difficoltà cresce scendendo di piano.
- **Handbook:** carte e nemici si scoprono giocando; contiene anche i record di carriera.

---

## 5. Interfaccia

- **Avvio:** contratto di assunzione da firmare tenendo premuto; poi un manifesto di propaganda con il boss e il
  cartellino da timbrare (*New run* o *Back to work*).
- **Mappa:** la pianta dell'ufficio con nebbia sulle stanze lontane; il boss è un orologio che segna l'ora del turno.
- **Scontro:** si entra da una doppia porta d'ufficio; tutto ciò che serve (nemico, minaccia, vita, nastro, mana, sleeve)
  sta in una colonna sola, senza distogliere lo sguardo dalle carte.
- **Fine run:** busta paga stampata, timbrata *Paid* o *Void*, condivisibile; se sblocca un eroe, un biglietto lo presenta.
- **Impostazioni:** volumi, velocità, riduci animazioni, vibrazione, verso del nastro, lingua.

## 6. Direzione artistica e audio

- **Riso pop + pixel, un po' dark:** notte viola retinata; carte e bottoni come stampe su carta con ombre nette.
  Quattro inchiostri (rosa fluo, blu, giallo, scuro) più le sovrastampe.
- **Mai:** sfumature per l'ombra, glow, finto 3D, cerchi decorativi, emoji come icone.
- **Fabbrica con misura:** l'atto 1 è una fabbrica nella cripta (ossa, candele, un po' di ottone); ingranaggi, caldaie e
  automi crescono atto dopo atto.
- **Pixel art** generata all'avvio da disegni vettoriali. Animazioni a scatti (tranne le finestre).
- **Colori delle carte:** banda del nome = classe; illustrazione = categoria; gemma = rarità.
- **Font:** Silkscreen per i titoli, Jersey 10 per interfaccia e numeri, Space Grotesk per i testi lunghi.
- **Musica chiptune procedurale** (una traccia per turno, più élite, boss, pausa, vittoria) ed effetti sintetizzati.
