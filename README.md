# Liverstone

Deckbuilder roguelike **in tempo reale a nastro trasportatore**, per browser mobile in verticale.
Ispirato a *Cardstone* (Running Pillow, 2015). Stile ufficiale: **colori riso pop + pixel art, un po' dark/scary**.

> Questo file è una panoramica del gioco. I valori precisi (vita, danni, costi, probabilità) vivono nei dati del
> codice. La parte tecnica (stack, architettura, convenzioni, come aggiungere contenuti) è in [CLAUDE.md](CLAUDE.md).

**Avvio rapido:** `npm install`, poi `npm run dev` (apribile anche dal telefono sulla stessa Wi-Fi).

---

## 1. Il gioco in breve

Scegli un eroe, scendi nella cripta piano per piano. Ogni combattimento è **in tempo reale**: le carte del
mazzo scorrono su un nastro da destra a sinistra e devi giocarle prima che cadano nel buio. Il mana si ricarica
col tempo, il nemico telegrafa le mosse. Tra un piano e l'altro migliori il mazzo scambiando carte.

### Cosa viene da Cardstone e cosa abbiamo cambiato

| Cardstone | Liverstone |
| --- | --- |
| Carte che scorrono "come i piattini del sushi" | Il **nastro**, a cadenza fissa: giocare veloce non fa pescare di più |
| Mana che si ricarica, carte che alzano il massimo | **Cristalli**: si parte con poco mana e si cresce durante lo scontro |
| Un nemico per piano con la sua velocità d'attacco | Attacco base lento e pesante + **mossa speciale** periodica, telegrafati |
| Scambio di una carta dopo ogni battaglia | **Ricompensa = sempre uno scambio** (il mazzo ha dimensione fissa) |
| "Manica" per tenere carte da parte | **Sleeve** con pochi slot, con dentro la carta speciale dell'eroe |
| Eroi con abilità | Eroi con passiva, abilità a mana e carta speciale una volta per run |
| Oro per sbloccare carte, timer "cibo" | Compendio con scoperta delle carte; nessun timer di energia |

---

## 2. Regole del combattimento

- **Start:** lo scontro parte solo quando premi START. Prima (e durante) puoi **tenere premuto** qualunque cosa per
  leggerla: carte, stati, abilità, ritratto (passiva), barra minaccia, mana.
- **Nastro:** tocca una carta per giocarla, trascinala in su verso il nemico per giocarla, trascinala in giù
  nella sleeve per tenerla. Una carta che esce a sinistra finisce negli scarti (le maledizioni *volatili*
  esplodono o ti puniscono). Quando il mazzo finisce, gli scarti si rimescolano. Alcune carte danno **Rush**:
  il nastro accelera e le carte arrivano prima.
- **Mana:** si ricarica col tempo, a un ritmo che dipende dall'eroe. Il massimo parte basso e cresce con le
  carte **cristallo**, che arrivano per prime e valgono una volta per scontro.
- **Nemici:** un **attacco base** lento e pesante e, a intervalli, una **mossa speciale** (colpo ancora più forte,
  maledizioni, furto, blocco); gli speciali si alternano. Ogni colpo è un momento da preparare, con respiro in mezzo. La **barra minaccia** sopra il nastro mostra la mossa,
  il valore, il caricamento e quanto manca al prossimo speciale.
- **Difesa:** il **Blocco** assorbe i danni ma svanisce col tempo, quindi va giocato poco prima del colpo. Con il
  Blocco attivo la barra minaccia mostra il danno che passerà davvero; la barra vita mostra a strisce quanto perderai.
  Poco prima di ogni colpo c'è un segnale sonoro (diverso se il Blocco lo copre) e, se non è bloccato, i bordi lampeggiano.
- **Abilità dell'eroe:** mossa potente che costa molto mana, quindi va usata dopo aver fatto crescere i cristalli.
- **Carta speciale:** una per eroe, parte nella sleeve a ogni scontro, si usa **una volta per run**.
- **Stati:** Forza, Blocco, Veleno, Bruciatura, Congelamento, Stordimento, Debole, Vulnerabile, Schivata, Parata,
  Fortificato e altri legati agli eroi. Tieni premuto uno stato per leggerlo.

### La run

- **Atto 1 – La Cripta Dimenticata:** una colonna di piani con battaglie, falò, un'**élite** e il **boss** finale.
  La run è già modellata come grafo, pronta per una mappa a rami.
- **Ricompensa:** sopra tutto il mazzo, sotto alcune carte premio: scegli una carta per parte e **Scambia**, oppure
  **Salta**. Le élite danno carte più rare.
- **Falò:** cura una parte della vita, oppure **potenzia** una carta (selezioni, vedi l'anteprima, confermi).
- **Salvataggio** a ogni piano. Dalla pausa: *Main menu* (la run resta, lo scontro riparte) o *Abandon run*.

---

## 3. Eroi

| | Guerriero | Mago | Negromante |
| --- | --- | --- | --- |
| Archetipo | Blocco e attacchi pesanti | Catene di incantesimi, gelo, fuoco | Veleno |
| Passiva | **Iron Hide**: il Blocco svanisce più lentamente | **Spellweave**: gli incantesimi in catena diventano più forti | **Virulence**: il Veleno fa più danno |
| Abilità | **Berserk**: attacchi potenziati per qualche secondo | **Time Warp**: congela il nemico e accelera il nastro | **Pandemic**: raddoppia il Veleno sul nemico |
| Speciale | **Last Stand**: Blocco e Forza | **Meteor**: danno enorme e Bruciatura | **Death's Door**: cura e Veleno |

I mazzi iniziali hanno solo carte base e cristalli; tutte le altre arrivano come ricompensa.

---

## 4. Carte

- **Rarità:** iniziale, comune, rara, epica, leggendaria, più la speciale dell'eroe e le maledizioni.
- **Set:** uno per ogni eroe (attorno al suo archetipo), più carte **neutrali** (pozioni, cristalli, utilità)
  giocabili da tutti.
- **Faccia:** le carte mostrano **icone e numeri grandi**; il testo completo e il glossario si leggono tenendo
  premuto. Una condizione è tra parentesi (es. un attacco che fa più danni se hai Blocco).
- **Potenziamento:** ogni carta ha una versione migliorata, ottenibile al falò.
- **Maledizioni:** date dai nemici, durano solo lo scontro: intasano il nastro, ti feriscono, esplodono,
  rubano mana o avvelenano se le lasci uscire.
- **Parole chiave:** Innate (arriva per prima), Esaurisci (una volta per scontro), Consuma (sparisce dal mazzo),
  Fugace (sparisce se esce dal nastro), Volatile (effetto all'uscita), Rush (accelera il nastro), Potere (dura
  tutto lo scontro), X (spende tutto il mana).

---

## 5. Nemici (Atto 1)

| Nemico | Stile |
| --- | --- |
| Crypt Rat | Morsi rapidi e raffiche di colpi |
| Skeleton | Colpi lenti, poi un colpo pesantissimo |
| Ooze | Riempie il nastro di Slime e il mazzo di Tossine |
| Cultist | Rituale che lo rende più forte e ti ruba mana |
| Goblin Thief | Ruba carte e accende bombe sul nastro |
| **Bone Knight** (élite) | Colpi che rendono Vulnerabile, muro di scudi, si infuria a metà vita |
| **The Lich** (boss) | Maledizioni, bombe e il colpo DOOM; a metà vita accelera |

La difficoltà cresce scendendo di piano.

---

## 6. Schermate e interfaccia

- **Home:** logo animato, Lich, candele pixel animate; Nuova run / Continua, Compendio, Come si gioca, Impostazioni.
- **Scelta eroe:** carosello orizzontale "da videogioco" (eroe grande sul piedistallo, frecce e indicatori).
- **Percorso:** colonna dei piani dell'atto con icone (battaglia, falò, élite, boss).
- **Combattimento**, dall'alto: barra superiore (piano, velocità di gioco, pausa) · nemico con stati e vita ·
  barra minaccia · **nastro** · eroe (ritratto, vita, Blocco, stati) · mana · sleeve, pile, abilità. Vita del nemico,
  mossa in arrivo e vita dell'eroe stanno a ridosso del nastro, così non serve distogliere lo sguardo dalle carte.
- **Ricompensa, falò** (con animazione di cura), **vittoria e fine run** (statistiche), **Compendio** (carte per
  classe con scoperte, nemici con mosse).
- **Impostazioni:** musica, effetti, velocità, riduci animazioni, vibrazione. Tutti i testi sono pronti per altre lingue.

## 7. Direzione artistica e audio

- **Riso pop + pixel, un po' dark:** notte viola retinata; carte, bottoni ed etichette come stampe su carta
  con ombre nette sfalsate. Quattro inchiostri: rosa fluo, blu, giallo, inchiostro scuro (+ sovrastampe).
- **Mai:** sfumature per l'ombreggiatura, glow, finto 3D, cerchi decorativi di sfondo, motivi industriali.
- **Pixel art** generata dai disegni vettoriali all'avvio: livelli d'inchiostro, retino a puntini, contorno.
- **Animazioni a scatti** (tranne le finestre, fluide); colpi con flash invertito; danni come "-N" su macchia di sangue.
- **Colori delle carte:** banda del nome = classe (rosa Guerriero, blu Mago, verde Negromante, giallo neutre,
  nero maledizioni); illustrazione = categoria (rosa attacco, blu difesa, giallo utilità, verde maledizione);
  gemma a rombo solo per rare (blu), epiche (rosa) e leggendarie (gialla).
- **Font:** Silkscreen per le parole dei titoli, Jersey 10 per interfaccia e numeri, Space Grotesk per i testi lunghi.
- **Musica chiptune procedurale:** menu (carillon), combattimento, élite (marcia cupa), boss, falò, pausa (calma),
  vittoria. Effetti sonori sintetizzati, vibrazione sui colpi.
