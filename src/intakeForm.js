'use strict';

const CALLBACK_ID = 'intake_submit';

function plainText(text, emoji = true) {
  return { type: 'plain_text', text, emoji };
}

function header(text) {
  return { type: 'header', text: plainText(text) };
}

const divider = { type: 'divider' };

function textInput(blockId, label, { optional = true, multiline = false, placeholder } = {}) {
  return {
    type: 'input',
    block_id: blockId,
    optional,
    label: plainText(label),
    element: {
      type: 'plain_text_input',
      action_id: blockId,
      multiline,
      ...(placeholder ? { placeholder: plainText(placeholder) } : {}),
    },
  };
}

function selectInput(blockId, label, options, { optional = true, placeholder = 'Select an option' } = {}) {
  return {
    type: 'input',
    block_id: blockId,
    optional,
    label: plainText(label),
    element: {
      type: 'static_select',
      action_id: blockId,
      placeholder: plainText(placeholder),
      options: options.map((opt) => ({ text: plainText(opt), value: opt })),
    },
  };
}

function multiSelectInput(blockId, label, options, { optional = true, placeholder = 'Select all that apply' } = {}) {
  return {
    type: 'input',
    block_id: blockId,
    optional,
    label: plainText(label),
    element: {
      type: 'multi_static_select',
      action_id: blockId,
      placeholder: plainText(placeholder),
      options: options.map((opt) => ({ text: plainText(opt), value: opt })),
    },
  };
}

function datePickerInput(blockId, label, { optional = true } = {}) {
  return {
    type: 'input',
    block_id: blockId,
    optional,
    label: plainText(label),
    element: {
      type: 'datepicker',
      action_id: blockId,
      placeholder: plainText('Select a date'),
    },
  };
}

function usersSelectInput(blockId, label, { optional = true } = {}) {
  return {
    type: 'input',
    block_id: blockId,
    optional,
    label: plainText(label),
    element: {
      type: 'users_select',
      action_id: blockId,
      placeholder: plainText('Select a teammate'),
    },
  };
}

const CONTRACT_TERM_OPTIONS = ['Month-to-month', '6 months', '1 year', '2 years', '3 years', 'Other'];
const BILLING_CADENCE_OPTIONS = ['Monthly', 'Quarterly', 'Annual', 'Other'];
const POS_SYSTEM_OPTIONS = ['Toast', 'Square', 'Clover', 'Other'];
const ORDERING_PLATFORM_OPTIONS = ['DoorDash', 'Uber Eats', 'Seamless/Grubhub', 'Direct Website', 'Other'];
const SOURCE_OF_TRUTH_OPTIONS = [...ORDERING_PLATFORM_OPTIONS, 'Undecided'];
const COMM_CHANNEL_OPTIONS = ['Cellphone', 'Landline', 'WhatsApp', 'Instagram', 'Facebook'];
const PHONE_PLAN_OPTIONS = [
  'Dedicated cellphone',
  'Shared cellphone',
  'Landline SMS-enablement',
  'New cell line',
  'TBD',
];

/**
 * Build the `intake_submit` modal view. Pure Block Kit JSON — safe to call
 * without a live Slack connection (used by scripts/demo.js too).
 * @returns {object} Slack view payload
 */
function buildIntakeModalView() {
  return {
    type: 'modal',
    callback_id: CALLBACK_ID,
    title: plainText('Restaurant Intake'),
    submit: plainText('Create Channel'),
    close: plainText('Cancel'),
    blocks: [
      header('🏢 Business & Contact'),
      divider,
      textInput('restaurant_name', 'Restaurant name', { optional: false }),
      textInput('legal_business_name', 'Legal business name'),
      textInput('business_address', 'Business address', { optional: false }),
      textInput('location', 'Location / market'),
      textInput('number_of_locations', '# of locations'),
      textInput('decision_maker_name', 'Decision maker name', { optional: false }),
      textInput('decision_maker_role', 'Decision maker role'),
      textInput('decision_maker_email', 'Decision maker email', { optional: false }),
      textInput('decision_maker_phone', 'Decision maker phone', { optional: false }),
      textInput('billing_contact', 'Billing contact'),

      header('📄 Contract'),
      divider,
      datePickerInput('close_date', 'Close date'),
      textInput('acv', 'ACV', { optional: false }),
      selectInput('contract_term', 'Contract term', CONTRACT_TERM_OPTIONS, { optional: false }),
      selectInput('billing_cadence', 'Billing cadence', BILLING_CADENCE_OPTIONS),
      textInput('contract_link', 'Contract link'),

      header('🍽️ Restaurant Stack'),
      divider,
      datePickerInput('kickoff_date', 'Kickoff date', { optional: false }),
      selectInput('pos_system', 'POS system', POS_SYSTEM_OPTIONS, { optional: false }),
      textInput('pos_details', 'POS details'),
      multiSelectInput('ordering_platforms', 'Ordering platforms', ORDERING_PLATFORM_OPTIONS, { optional: false }),
      selectInput('source_of_truth', 'Source of truth', SOURCE_OF_TRUTH_OPTIONS, { optional: false }),
      multiSelectInput('comm_channels', 'Comm channels', COMM_CHANNEL_OPTIONS),
      selectInput('phone_plan', 'Phone plan', PHONE_PLAN_OPTIONS),
      textInput('menu_notes', 'Menu notes', { multiline: true }),

      header('👥 Team & Handoff'),
      divider,
      usersSelectInput('csm', 'CSM', { optional: false }),
      usersSelectInput('fde', 'FDE'),
      usersSelectInput('ai_eng', 'AI/Engineering'),
      usersSelectInput('cc_lead', 'Command Center Lead'),
      textInput('handoff_notes', 'Handoff notes', { multiline: true }),
    ],
  };
}

module.exports = {
  CALLBACK_ID,
  buildIntakeModalView,
  CONTRACT_TERM_OPTIONS,
  BILLING_CADENCE_OPTIONS,
  POS_SYSTEM_OPTIONS,
  ORDERING_PLATFORM_OPTIONS,
  SOURCE_OF_TRUTH_OPTIONS,
  COMM_CHANNEL_OPTIONS,
  PHONE_PLAN_OPTIONS,
};
