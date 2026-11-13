# Humanities Helping Hands

Every claim, checked in the open. Paste a sentence, a machine works out the math in it, and the sentence comes back **Proven**, **False** or **Not checked**, with the working shown. The live site is [humanitieshelpinghands.com](https://humanitieshelpinghands.com).

This library belongs to everyone. Read it, run it, build on it.

## Start with a real check

You need [Node.js](https://nodejs.org) 20 or newer. Nothing to install.

```bash
node landing-tests/known.mjs
```

That runs a set of known answers through the checker and prints how many it missed (it should say 0).

To check a sentence of your own, save this as `try.mjs` in this folder and run `node try.mjs`:

```js
import { findClaims, whole } from './landing/finder.js';
import { run } from './landing/checker.js';

for (const claim of findClaims('15% of 80 is 12. Double 2 + 3 is 9.')) {
  const [label, , why] = whole(claim, run(claim.form, claim.said));
  console.log(label, '|', claim.said, '|', why);
}
```

It prints `PROVEN` for the first sentence and `FALSIFIED` for the second, each with the exact working.

## What is here

| Folder | What it is |
| --- | --- |
| `landing/` | The website as it is served: the pages, the checker, and the library of facts with their labels. |
| `landing-tests/` | Three tests you can run with Node today. |

## You want to... go to...

| You want to... | Go to... |
| --- | --- |
| Check a sentence in your own code | `landing/finder.js` reads the sentence, `landing/checker.js` settles it |
| See every fact and how it was checked | `landing/facts.json` (each fact names its checker and the exact statement checked) |
| Re-run the proofs behind the facts | [lean-proofs](https://github.com/IniquitousAi/lean-proofs), the Lean proofs with a one-line re-run |
| Run the site on your own machine | Serve the `landing/` folder with any static file server and open `/v3/` |
| See what the checker gets right and wrong | `landing-tests/percent_side_test.mjs` (hundreds of sentences with the label each must get) |

## What the labels mean

- **PROVEN**: a machine worked the math out exactly, or a proof checker accepted the proof.
- **FALSIFIED** (shown as False): the math, as written, does not hold. The exact value is shown.
- **GUESS** (shown as Not checked): the checker could not settle it. Not checked never means false.

## What it does not do

- It reads math in sentences: sums, percents, shares, units, rates, primes. History, health and news come back Not checked.
- When a sentence could mean two things, it does not pick one and call the other false. "Double 2 + 3 is 10." comes back Not checked, with a note to add brackets.
- A wrong answer that was read from loose words is held back as Not checked, because the sentence may count something the checker does not read.
- This folder is a copy made for reading and reuse. Every file in `landing/` is what the live site already serves. Not in it yet: the site's server parts (the door AI tools use, the counter, the forms), the tools that build and upload the live site, and most of its tests. Also left out: two run logs the live site shows (`mistakes.json`, `updated.json`), five old pages the live site now forwards to their newer versions, and its hosting settings file.
- The notes inside the code were taken out of this copy. This page and the tests are the explanation for now.
