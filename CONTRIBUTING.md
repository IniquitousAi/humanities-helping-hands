# Contributing

Thank you for helping. There are three ways in, from easiest to hardest.

## 1. The checker got a sentence wrong

Open an issue with the form **The checker got this sentence wrong**. Give the sentence, the label it gave, and the label it
should give. That sentence becomes a test, so the same mistake cannot come back.

## 2. Add a fact

Add one entry to `landing/facts.json`, in the shape of the ones there. A fact goes in as **PROVEN** only with a check anyone can
re-run; anything else goes in as **GUESS**. A fact is never refused for being a guess, only labeled as one.

## 3. Add a Lean proof

Write the proof in [lean-proofs](https://github.com/IniquitousAi/lean-proofs), with no `sorry`, and check it there with
`./check.sh`. Then link its theorem from the fact in `landing/facts.json`.

## Before you open a pull request

```bash
node landing-tests/known.mjs
node landing-tests/percent_side_test.mjs
node landing-tests/neg_test.mjs
```

All three must still pass. Say where the fact comes from, and keep each pull request to one fact or one fix.

Every pull request is read by a person before it goes in. Nothing is merged on its own.
