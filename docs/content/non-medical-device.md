# Non-medical-device positioning

loci is a general wellness and care coordination tool. It is intended to help people organize instructions they already received from licensed clinicians, coordinate family and carers, and find comfort activities.

It is **not** intended to diagnose, treat, cure, mitigate or prevent any disease or condition, and it has not been evaluated or cleared by the FDA, the MHRA, an EU notified body or any other regulator.

Design choices that keep it on this side of the line:

| Area | What loci does | What loci never does |
| --- | --- | --- |
| Plan | Stores the clinician's text and times; reminds | Suggests, calculates or changes doses or treatments |
| Check-ins | Records self-reported scales and ticked signs | Scores risk, predicts deterioration, interprets symptoms |
| Flags | Matches a clinician-written rule and repeats it | Decides what a value means clinically |
| Taste | Suggests music, shows, books, meals and places | Infers health conditions or uses taste for eligibility |
| Dashboard | Shows what consenting patients shared | Triages or replaces clinical judgment |

Any future feature that interprets clinical data would need a regulatory assessment before release.
