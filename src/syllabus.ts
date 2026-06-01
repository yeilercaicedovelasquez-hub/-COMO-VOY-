/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AcademicGrade, AcademicSubject } from './types';

export const SUBJECTS: Record<AcademicGrade, AcademicSubject[]> = {
  '6': ['Español', 'Sociales'],
  '7': ['Español'],
  '11': ['Filosofía']
};

export const SYLLABUS_TOPICS: Record<string, Record<number, string[]>> = {
  '6-Español': {
    1: [
      'Concepto de lenguaje, lengua y habla',
      'Elementos de la comunicación',
      'Funciones del lenguaje',
      'El texto narrativo: mito y leyenda',
      'Categorías gramaticales',
      'Plan Lector: La Luna en los almendros'
    ],
    2: [
      'Clases de cuentos',
      'La novela: origen y características',
      'La estructura de la oración',
      'El Sintagma nominal',
      'Ortografía: Uso de B y V',
      'Los medios de comunicación'
    ],
    3: [
      'El género lírico',
      'El texto expositivo',
      'Subgéneros líricos',
      'El sintagma verbal',
      'La tilde diacrítica'
    ],
    4: [
      'La lírica popular',
      'El texto argumentativo: la reseña',
      'El género teatral',
      'Coherencia y cohesión textual',
      'Signos de puntuación'
    ]
  },
  '6-Sociales': {
    1: [
      'Gobierno escolar',
      'Origen de la democracia',
      'Democracia en Colombia',
      'Democracia y Participación',
      'Universo y su Estructura',
      'El sistema solar'
    ],
    2: [
      'Formación y estructura interna de la tierra',
      'El relieve y sus formas',
      'El clima: elementos y factores',
      'La hidrografía',
      'Geografía de los continentes'
    ],
    3: [
      'Historia y prehistoria',
      'Mesopotamia y Egipto',
      'Persas y Hebreos',
      'China e India',
      'El mundo griego',
      'Roma: espacio y origen'
    ],
    4: [
      'Poblamiento de América',
      'Periodos históricos de América precolombina',
      'Aztecas, Mayas e Incas',
      'Poblamiento de Colombia',
      'Familias indígenas de Colombia'
    ]
  },
  '7-Español': {
    1: [
      'Concepto de signo lingüístico',
      'La tradición oral regional y nacional',
      'Características del relato de aventuras',
      'Gramática y sus componentes',
      'Tipología textual',
      'Plan Lector: El principito'
    ],
    2: [
      'Recursos literarios medievales',
      'El texto argumentativo',
      'Literatura medieval española',
      'Gramática: el adverbio',
      'Ortografía: uso de la H'
    ],
    3: [
      'El Renacimiento literario',
      'El soneto',
      'Texto informativo: el artículo',
      'Gramática: la conjunción'
    ],
    4: [
      'El Barroco literario',
      'Don Quijote de la Mancha',
      'El teatro del Siglo de Oro',
      'Producción de textos creativos'
    ]
  },
  '11-Filosofía': {
    1: [
      'Generalidades de la filosofía moderna',
      'Racionalismo: Descartes, Spinoza, Leibniz',
      'Empirismo: Locke, Hume, Berkeley',
      'Ilustración: Rousseau, Voltaire, Kant',
      'Disciplinas filosóficas: Ontología, Epistemología'
    ],
    2: [
      'Filosofía contemporánea S.XIX',
      'Dialéctica: Hegel, Marx',
      'Positivismo: Comte',
      'Vitalismo: Nietzsche, Kierkegaard',
      'Existencialismo: Heidegger, Sartre',
      'Fenomenología: Husserl'
    ],
    3: [
      'Filosofía oriental: Budismo, Taoísmo',
      'Confucianismo, Hinduismo',
      'Corrientes filosóficas en Occidente',
      'Concordancias Oriente-Occidente',
      'Filosofía latinoamericana: Zuleta, Dussel'
    ],
    4: [
      'Filosofía de la ciencia: Kuhn, Popper',
      'Hermenéutica: Gadamer, Ricoeur',
      'Posmodernismo: Lyotard, Derrida',
      'Ciudadanía cosmopolita',
      'Ética y Política contemporáneas'
    ]
  }
};
