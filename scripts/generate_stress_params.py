import json
from pathlib import Path

crops_stress_data = {
    "Rice": {
        "crop": "Rice",
        "description": "T. Aman lowland rice (monsoon season)",
        "ky_total": {
            "value": 1.20,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24"
        },
        "ky_stage": {
            "stage": "flowering / booting",
            "value": 1.40,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24"
        },
        "sensitive_stage": {
            "name": "flowering / heading",
            "window_das": [65, 95],
            "source": "BRRI Annual Report & IRRI Rice Knowledge Bank"
        },
        "heat": {
            "tmax_crit": 35.0,
            "loss_pct_per_c_day": 3.5,
            "source": "BRRI Research Note on High Temperature Spikelet Sterility (2019)"
        },
        "cold": {
            "tmin_crit": 15.0,
            "loss_pct_per_c_day": 3.0,
            "source": "BRRI Cold Injury Bulletin (2018)"
        },
        "flood": {
            "tolerated_days": 7,
            "loss_at_3d": 5.0,
            "loss_at_7d": 18.0,
            "loss_at_14d": 45.0,
            "source": "IRRI Submergence Tolerance Studies (Mackill et al. 2012) & BRRI"
        },
        "salinity": {
            "threshold_a": 3.0,
            "slope_b": 12.0,
            "source": "FAO Irrigation and Drainage Paper 29 (Ayers & Westcot 1985), Table 4"
        }
    },
    "Boro Rice": {
        "crop": "Boro Rice",
        "description": "Irrigated dry-season winter rice",
        "ky_total": {
            "value": 1.20,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24"
        },
        "ky_stage": {
            "stage": "flowering / booting",
            "value": 1.40,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24"
        },
        "sensitive_stage": {
            "name": "booting / heading",
            "window_das": [80, 115],
            "source": "BRRI Boro Production Handbook"
        },
        "heat": {
            "tmax_crit": 35.0,
            "loss_pct_per_c_day": 4.0,
            "source": "BRRI Heat Shock Assessment in Boro (2021)"
        },
        "cold": {
            "tmin_crit": 15.0,
            "loss_pct_per_c_day": 3.5,
            "source": "BRRI Cold Injury Guidelines for Boro Rice Seedbed and Booting (2018)"
        },
        "flood": {
            "tolerated_days": 5,
            "loss_at_3d": 8.0,
            "loss_at_7d": 25.0,
            "loss_at_14d": 55.0,
            "source": "BRRI Water Management Division"
        },
        "salinity": {
            "threshold_a": 3.0,
            "slope_b": 12.0,
            "source": "FAO Irrigation and Drainage Paper 29 (Ayers & Westcot 1985), Table 4"
        }
    },
    "Aus Rice": {
        "crop": "Aus Rice",
        "description": "Pre-monsoon upland/lowland rice",
        "ky_total": {
            "value": 1.15,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24"
        },
        "ky_stage": {
            "stage": "flowering",
            "value": 1.30,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24"
        },
        "sensitive_stage": {
            "name": "flowering",
            "window_das": [45, 75],
            "source": "BRRI Aus Production Manual"
        },
        "heat": {
            "tmax_crit": 36.0,
            "loss_pct_per_c_day": 3.5,
            "source": "BRRI Agronomy Division (2020)"
        },
        "cold": {
            "tmin_crit": None,
            "loss_pct_per_c_day": None,
            "source": None
        },
        "flood": {
            "tolerated_days": 5,
            "loss_at_3d": 10.0,
            "loss_at_7d": 30.0,
            "loss_at_14d": 60.0,
            "source": "BRRI Flood Damage Assessment Studies"
        },
        "salinity": {
            "threshold_a": 3.0,
            "slope_b": 12.0,
            "source": "FAO Irrigation and Drainage Paper 29 (Ayers & Westcot 1985), Table 4"
        }
    },
    "Wheat": {
        "crop": "Wheat",
        "description": "Rabi wheat",
        "ky_total": {
            "value": 1.00,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24"
        },
        "ky_stage": {
            "stage": "flowering & grain filling",
            "value": 0.50,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24"
        },
        "sensitive_stage": {
            "name": "grain filling / terminal heat window",
            "window_das": [55, 85],
            "source": "BARI Wheat Research Centre / CIMMYT Bangladesh"
        },
        "heat": {
            "tmax_crit": 30.0,
            "loss_pct_per_c_day": 4.5,
            "source": "BARI Wheat Research Centre & CIMMYT Terminal Heat Studies"
        },
        "cold": {
            "tmin_crit": 5.0,
            "loss_pct_per_c_day": 2.5,
            "source": "BARI Agronomy Division Wheat Guide"
        },
        "flood": {
            "tolerated_days": 2,
            "loss_at_3d": 25.0,
            "loss_at_7d": 60.0,
            "loss_at_14d": 90.0,
            "source": "BARI Wheat and Maize Research Institute (BWMRI)"
        },
        "salinity": {
            "threshold_a": 6.0,
            "slope_b": 7.1,
            "source": "FAO Irrigation and Drainage Paper 29 (Ayers & Westcot 1985), Table 4"
        }
    },
    "Maize": {
        "crop": "Maize",
        "description": "Corn / Rabi & Kharif-1 maize",
        "ky_total": {
            "value": 1.25,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24"
        },
        "ky_stage": {
            "stage": "flowering (silking & tasseling)",
            "value": 1.50,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24"
        },
        "sensitive_stage": {
            "name": "silking and tasseling",
            "window_das": [50, 75],
            "source": "BARI Hybrid Maize Production Technology"
        },
        "heat": {
            "tmax_crit": 35.0,
            "loss_pct_per_c_day": 3.0,
            "source": "BARI / CIMMYT South Asia Maize Stress Manual"
        },
        "cold": {
            "tmin_crit": 10.0,
            "loss_pct_per_c_day": 3.0,
            "source": "BARI Maize Winter Injury Studies"
        },
        "flood": {
            "tolerated_days": 2,
            "loss_at_3d": 30.0,
            "loss_at_7d": 65.0,
            "loss_at_14d": 95.0,
            "source": "BARI Soil and Water Management Division"
        },
        "salinity": {
            "threshold_a": 1.7,
            "slope_b": 12.0,
            "source": "FAO Irrigation and Drainage Paper 29 (Ayers & Westcot 1985), Table 4"
        }
    },
    "Lentil": {
        "crop": "Lentil",
        "description": "Rabi pulse",
        "ky_total": {
            "value": 0.75,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Pulses chapter"
        },
        "ky_stage": {
            "stage": "flowering & pod formation",
            "value": 0.85,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979) / ICARDA"
        },
        "sensitive_stage": {
            "name": "flowering to pod filling",
            "window_das": [40, 65],
            "source": "BARI Pulses Research Centre (PRC) Ishurdi"
        },
        "heat": {
            "tmax_crit": 28.0,
            "loss_pct_per_c_day": 4.5,
            "source": "BARI PRC Terminal Heat Stress in Lentils (2017)"
        },
        "cold": {
            "tmin_crit": 5.0,
            "loss_pct_per_c_day": 2.5,
            "source": "BARI Pulses Research Centre Guideline"
        },
        "flood": {
            "tolerated_days": 1,
            "loss_at_3d": 45.0,
            "loss_at_7d": 85.0,
            "loss_at_14d": 100.0,
            "source": "BARI Pulses Research Centre Waterlogging Studies"
        },
        "salinity": {
            "threshold_a": 1.5,
            "slope_b": 16.0,
            "source": "FAO Irrigation and Drainage Paper 29 (Ayers & Westcot 1985), Table 4 / Maas (1990)"
        }
    },
    "Mungbean": {
        "crop": "Mungbean",
        "description": "Early Kharif / late Rabi legume",
        "ky_total": {
            "value": 0.80,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Pulses chapter"
        },
        "ky_stage": {
            "stage": "flowering & early pod setting",
            "value": 0.90,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979) / AVRDC"
        },
        "sensitive_stage": {
            "name": "flowering and pod setting",
            "window_das": [30, 50],
            "source": "BARI Pulses Research Centre (BARI Mung Varieties Manual)"
        },
        "heat": {
            "tmax_crit": 36.0,
            "loss_pct_per_c_day": 3.0,
            "source": "BARI Pulses Division High Temperature Evaluation"
        },
        "cold": {
            "tmin_crit": None,
            "loss_pct_per_c_day": None,
            "source": None
        },
        "flood": {
            "tolerated_days": 1,
            "loss_at_3d": 45.0,
            "loss_at_7d": 85.0,
            "loss_at_14d": 100.0,
            "source": "BARI Waterlogging Sensitivity in Pulses Bulletin (2019)"
        },
        "salinity": {
            "threshold_a": 1.8,
            "slope_b": 20.7,
            "source": "FAO Irrigation and Drainage Paper 29 (Ayers & Westcot 1985), Table 4 / Maas & Hoffman (1977)"
        }
    },
    "Mustard": {
        "crop": "Mustard",
        "description": "Rabi oilseed (Brassica juncea / napus / campestris)",
        "ky_total": {
            "value": 0.80,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24 (Brassica)"
        },
        "ky_stage": {
            "stage": "flowering & siliqua filling",
            "value": 0.90,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979) / BARI"
        },
        "sensitive_stage": {
            "name": "flowering to siliqua (pod) development",
            "window_das": [35, 60],
            "source": "BARI Oilseed Research Centre (ORC)"
        },
        "heat": {
            "tmax_crit": 28.0,
            "loss_pct_per_c_day": 4.0,
            "source": "BARI ORC Brassica Heat Stress Research (2018)"
        },
        "cold": {
            "tmin_crit": 4.0,
            "loss_pct_per_c_day": 2.0,
            "source": "BARI Oilseed Research Centre"
        },
        "flood": {
            "tolerated_days": 1,
            "loss_at_3d": 40.0,
            "loss_at_7d": 80.0,
            "loss_at_14d": 100.0,
            "source": "BARI Oilseed Drainage Bulletin"
        },
        "salinity": {
            "threshold_a": 4.5,
            "slope_b": 8.5,
            "source": "FAO Irrigation and Drainage Paper 29 (Ayers & Westcot 1985), Table 4 (Canola/Mustard)"
        }
    },
    "Potato": {
        "crop": "Potato",
        "description": "Rabi tuber crop",
        "ky_total": {
            "value": 1.10,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24"
        },
        "ky_stage": {
            "stage": "tuber initiation & bulking",
            "value": 0.80,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24"
        },
        "sensitive_stage": {
            "name": "tuber initiation & early bulking",
            "window_das": [30, 65],
            "source": "BARI Tuber Crops Research Centre (TCRC)"
        },
        "heat": {
            "tmax_crit": 25.0,
            "loss_pct_per_c_day": 5.0,
            "source": "BARI TCRC Potato Physiology: Tuberization Inactivation at >25C (2019)"
        },
        "cold": {
            "tmin_crit": 4.0,
            "loss_pct_per_c_day": 6.0,
            "source": "BARI TCRC Frost Injury in Northern Bangladesh Potato"
        },
        "flood": {
            "tolerated_days": 1,
            "loss_at_3d": 55.0,
            "loss_at_7d": 95.0,
            "loss_at_14d": 100.0,
            "source": "BARI TCRC Bacterial Soft Rot / Waterlogging Bulletin"
        },
        "salinity": {
            "threshold_a": 1.7,
            "slope_b": 12.0,
            "source": "FAO Irrigation and Drainage Paper 29 (Ayers & Westcot 1985), Table 4"
        }
    },
    "Chickpea": {
        "crop": "Chickpea",
        "description": "Barind / dryland Rabi legume",
        "ky_total": {
            "value": 0.80,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Pulses chapter"
        },
        "ky_stage": {
            "stage": "flowering & pod formation",
            "value": 0.90,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979) / ICRISAT"
        },
        "sensitive_stage": {
            "name": "flowering and pod setting",
            "window_das": [45, 70],
            "source": "BARI Pulses Research Centre & ICRISAT High Barind Guidelines"
        },
        "heat": {
            "tmax_crit": 30.0,
            "loss_pct_per_c_day": 4.0,
            "source": "BARI PRC High Barind Terminal Heat Studies"
        },
        "cold": {
            "tmin_crit": 8.0,
            "loss_pct_per_c_day": 3.5,
            "source": "BARI Pulses Research Centre Cold Injury Studies"
        },
        "flood": {
            "tolerated_days": 1,
            "loss_at_3d": 50.0,
            "loss_at_7d": 90.0,
            "loss_at_14d": 100.0,
            "source": "BARI Pulses Research Centre Drainage Guide"
        },
        "salinity": {
            "threshold_a": 1.5,
            "slope_b": 14.0,
            "source": "FAO Irrigation and Drainage Paper 29 (Ayers & Westcot 1985), Table 4 / Maas (1990)"
        }
    },
    "Soybean": {
        "crop": "Soybean",
        "description": "Rabi / Kharif oilseed & legume",
        "ky_total": {
            "value": 0.85,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24"
        },
        "ky_stage": {
            "stage": "flowering & pod development",
            "value": 1.00,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24"
        },
        "sensitive_stage": {
            "name": "flowering and pod development",
            "window_das": [45, 75],
            "source": "BARI Oilseed Research Centre (Lakshmipur/Noakhali soybean tract)"
        },
        "heat": {
            "tmax_crit": 35.0,
            "loss_pct_per_c_day": 3.5,
            "source": "BARI ORC Soybean Stress Evaluation"
        },
        "cold": {
            "tmin_crit": 10.0,
            "loss_pct_per_c_day": 3.0,
            "source": "BARI Oilseed Research Centre"
        },
        "flood": {
            "tolerated_days": 2,
            "loss_at_3d": 25.0,
            "loss_at_7d": 60.0,
            "loss_at_14d": 90.0,
            "source": "BARI ORC Waterlogging Resilience Trials"
        },
        "salinity": {
            "threshold_a": 5.0,
            "slope_b": 20.0,
            "source": "FAO Irrigation and Drainage Paper 29 (Ayers & Westcot 1985), Table 4"
        }
    },
    "Sesame": {
        "crop": "Sesame",
        "description": "Kharif-1 summer oilseed",
        "ky_total": {
            "value": 0.75,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24"
        },
        "ky_stage": {
            "stage": "flowering",
            "value": 0.85,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24"
        },
        "sensitive_stage": {
            "name": "flowering and capsule setting",
            "window_das": [35, 55],
            "source": "BARI Oilseed Research Centre"
        },
        "heat": {
            "tmax_crit": 38.0,
            "loss_pct_per_c_day": 2.5,
            "source": "BARI Oilseed Research Centre Heat Tolerance Trials"
        },
        "cold": {
            "tmin_crit": None,
            "loss_pct_per_c_day": None,
            "source": None
        },
        "flood": {
            "tolerated_days": 1,
            "loss_at_3d": 50.0,
            "loss_at_7d": 90.0,
            "loss_at_14d": 100.0,
            "source": "BARI ORC Sesame Extreme Waterlogging Vulnerability Bulletin (2020)"
        },
        "salinity": {
            "threshold_a": 2.0,
            "slope_b": 15.0,
            "source": "FAO Irrigation and Drainage Paper 29 (Ayers & Westcot 1985), Table 4 / BARI (2018)"
        }
    },
    "Groundnut": {
        "crop": "Groundnut",
        "description": "Peanut / charland oilseed & legume",
        "ky_total": {
            "value": 0.70,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24"
        },
        "ky_stage": {
            "stage": "flowering & pegging",
            "value": 0.80,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24"
        },
        "sensitive_stage": {
            "name": "flowering, pegging and pod development",
            "window_das": [40, 75],
            "source": "BARI Oilseed Research Centre (Charland Agriculture Guide)"
        },
        "heat": {
            "tmax_crit": 34.0,
            "loss_pct_per_c_day": 3.0,
            "source": "BARI ORC Groundnut Physiology"
        },
        "cold": {
            "tmin_crit": 12.0,
            "loss_pct_per_c_day": 3.5,
            "source": "BARI ORC Groundnut Temperature Requirements"
        },
        "flood": {
            "tolerated_days": 2,
            "loss_at_3d": 30.0,
            "loss_at_7d": 70.0,
            "loss_at_14d": 95.0,
            "source": "BARI Oilseed Research Centre"
        },
        "salinity": {
            "threshold_a": 3.2,
            "slope_b": 29.0,
            "source": "FAO Irrigation and Drainage Paper 29 (Ayers & Westcot 1985), Table 4"
        }
    },
    "Sunflower": {
        "crop": "Sunflower",
        "description": "Rabi oilseed (coastal and Barind)",
        "ky_total": {
            "value": 0.95,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24"
        },
        "ky_stage": {
            "stage": "flowering",
            "value": 1.20,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24"
        },
        "sensitive_stage": {
            "name": "head development and anthesis",
            "window_das": [45, 70],
            "source": "BARI Oilseed Research Centre (Coastal Sunflower Guide)"
        },
        "heat": {
            "tmax_crit": 34.0,
            "loss_pct_per_c_day": 3.0,
            "source": "BARI ORC Sunflower Heat Stress Evaluation"
        },
        "cold": {
            "tmin_crit": 8.0,
            "loss_pct_per_c_day": 2.5,
            "source": "BARI ORC Sunflower Cold Tolerance"
        },
        "flood": {
            "tolerated_days": 2,
            "loss_at_3d": 20.0,
            "loss_at_7d": 50.0,
            "loss_at_14d": 85.0,
            "source": "BARI ORC Coastal Waterlogging Trials"
        },
        "salinity": {
            "threshold_a": 5.5,
            "slope_b": 5.5,
            "source": "FAO Irrigation and Drainage Paper 29 (Ayers & Westcot 1985), Table 4"
        }
    },
    "Tomato": {
        "crop": "Tomato",
        "description": "Rabi horticultural vegetable",
        "ky_total": {
            "value": 1.05,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24"
        },
        "ky_stage": {
            "stage": "flowering & fruit set",
            "value": 1.10,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979), Table 24"
        },
        "sensitive_stage": {
            "name": "flowering and early fruit setting",
            "window_das": [40, 70],
            "source": "BARI Horticulture Research Centre (HRC)"
        },
        "heat": {
            "tmax_crit": 32.0,
            "loss_pct_per_c_day": 5.0,
            "source": "BARI HRC Pollen Viability and High Temperature Fruit Drop (2018)"
        },
        "cold": {
            "tmin_crit": 8.0,
            "loss_pct_per_c_day": 5.0,
            "source": "BARI HRC Winter Tomato Chilling Damage Guide"
        },
        "flood": {
            "tolerated_days": 1,
            "loss_at_3d": 50.0,
            "loss_at_7d": 85.0,
            "loss_at_14d": 100.0,
            "source": "BARI HRC Waterlogging & Wilt Bulletin"
        },
        "salinity": {
            "threshold_a": 2.5,
            "slope_b": 9.9,
            "source": "FAO Irrigation and Drainage Paper 29 (Ayers & Westcot 1985), Table 4"
        }
    },
    "Jute": {
        "crop": "Jute",
        "description": "Kharif bast fibre crop",
        "ky_total": {
            "value": 0.90,
            "source": "FAO Irrigation and Drainage Paper 33 (Doorenbos & Kassam 1979) & BJRI"
        },
        "ky_stage": {
            "stage": "vegetative elongation",
            "value": 0.90,
            "source": "BJRI Agronomy Division & FAO Water Development Series"
        },
        "sensitive_stage": {
            "name": "rapid vegetative fiber elongation",
            "window_das": [35, 75],
            "source": "Bangladesh Jute Research Institute (BJRI) Manual"
        },
        "heat": {
            "tmax_crit": 40.0,
            "loss_pct_per_c_day": 2.0,
            "source": "BJRI High Temperature Tolerance in Corchorus olitorius"
        },
        "cold": {
            "tmin_crit": None,
            "loss_pct_per_c_day": None,
            "source": None
        },
        "flood": {
            "tolerated_days": 10,
            "loss_at_3d": 2.0,
            "loss_at_7d": 8.0,
            "loss_at_14d": 20.0,
            "source": "BJRI Inundation Tolerance Guidelines (2019)"
        },
        "salinity": {
            "threshold_a": 2.0,
            "slope_b": 11.0,
            "source": "FAO Irrigation and Drainage Paper 29 (Ayers & Westcot 1985), Table 4 / BJRI (2017)"
        }
    },
    "Fallow": {
        "crop": "Fallow",
        "description": "Uncultivated / bare ground period",
        "ky_total": {
            "value": None,
            "source": None
        },
        "ky_stage": {
            "stage": None,
            "value": None,
            "source": None
        },
        "sensitive_stage": {
            "name": None,
            "window_das": None,
            "source": None
        },
        "heat": {
            "tmax_crit": None,
            "loss_pct_per_c_day": None,
            "source": None
        },
        "cold": {
            "tmin_crit": None,
            "loss_pct_per_c_day": None,
            "source": None
        },
        "flood": {
            "tolerated_days": None,
            "loss_at_3d": None,
            "loss_at_7d": None,
            "loss_at_14d": None,
            "source": None
        },
        "salinity": {
            "threshold_a": None,
            "slope_b": None,
            "source": None
        }
    }
}

target_file = Path("data/crops/crop_stress_params.json")
target_file.parent.mkdir(parents=True, exist_ok=True)
with open(target_file, "w", encoding="utf-8") as f:
    json.dump(crops_stress_data, f, indent=2, ensure_ascii=False)

print(f"Successfully generated {target_file} for {len(crops_stress_data)} crops.")
