# Enersight — Technical Team

Enersight is an IoT-based energy monitoring solution built around smart meters. It helps two kinds of users understand their electricity usage:

- **Electricians** can view real-time energy consumption through a web dashboard.
- **Accountants** can review energy expenses across different months and years, and see a forecast of the expected cost for the coming month, powered by a machine learning prediction model.

This repository holds the technical work for the project: the data science / machine learning models and the web dashboard.

> This is a long-term internship project developed as part of our bachelor's degree.

## Features

- Monthly and yearly energy expense overview for accountants
- Next-month cost prediction using machine learning
- Cleaned and processed electricity consumption datasets
- Real-time energy consumption dashboard for electricians *(in progress)*

## Tech stack

- **Language:** Python
- **Machine learning:** XGBoost, Extra Trees, LightGBM
- **Data handling:** pandas, NumPy, scikit-learn
- **Web dashboard:** <!-- TODO: add your framework here, e.g. Flask / Django / React -->

## Repository structure

```
Enersight_Technical_Team/
├── ml-model/          # Data cleaning, model training, and prediction code
├── web-dashboard/     # Web dashboard (accountant + electrician views)
├── data/              # Datasets (ignored by Git — never uploaded)
├── docs/              # Reports, notes, and project documentation
├── .gitignore
└── README.md
```

## Getting started

1. Clone the repository:
   ```bash
   git clone https://github.com/Kimsrorng-ly/Enersight_Technical_Team.git
   cd Enersight_Technical_Team
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate      # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   <!-- TODO: create a requirements.txt listing the packages your project uses -->

## How we work (branching)

We keep `main` as the stable version of the project. **Nobody pushes directly to `main`.**

For any new task, create a branch named after the task, work on it, then open a Pull Request to merge it back:

```bash
git switch -c prediction-model        # create and move onto your task branch
# ... make your changes, then:
git add .
git commit -m "Describe what you did"
git push -u origin prediction-model   # upload your branch to GitHub
```

Then open a **Pull Request** on GitHub. A teammate reviews it, and once approved it is merged into `main`. After merging, the branch is deleted.

Example branch names: `data-cleaning`, `prediction-model`, `accountant-dashboard`, `electrician-dashboard`.

**Before starting work each day**, run `git pull` to get the latest version.

## Team

| Role                          | Members                                |
|-------------------------------| ---------------------------------------|
| Data Science                  | Ly Kimsrorng, Tith Vichra, Yan Sopanha |
| Software Engineering & DevOp  | Sok Sonita, Klo Chhialy                |
| Business Intelligence         | Kim Lida, Sovan HorngChheang           |
