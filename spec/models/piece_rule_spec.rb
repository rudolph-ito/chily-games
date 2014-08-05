require 'spec_helper'

describe PieceRule do
  context 'validating' do
    let(:piece_rule) { build(:piece_rule, piece_rule_params) }
    let(:piece_rule_params) { {} }

    context 'with the default factory' do
      specify { expect(piece_rule).to be_valid }
    end

    context 'no count' do
      let(:piece_rule_params) { {count: nil} }
      specify { expect(piece_rule).to be_invalid }
    end

    context 'count < 1' do
      let(:piece_rule_params) { {count: 0} }
      specify { expect(piece_rule).to be_invalid }
    end

    context 'no movement_type' do
      let(:piece_rule_params) { {movement_type: nil} }
      specify { expect(piece_rule).to be_invalid }
    end

    context 'no movement_minimum' do
      let(:piece_rule_params) { {movement_minimum: nil} }
      specify { expect(piece_rule).to be_invalid }
    end

    context 'movement_maximum < 1' do
      let(:piece_rule_params) { {movement_minimum: 0} }
      specify { expect(piece_rule).to be_invalid }
    end

    context 'no movement_maximum' do
      let(:piece_rule_params) { {movement_maximum: nil} }
      specify { expect(piece_rule).to be_valid }
    end

    context 'movement_maximum < movement_minimum' do
      let(:piece_rule_params) { {movement_minimum: 2, movement_maximum: 1} }
      specify { expect(piece_rule).to be_invalid }
    end

    context 'no piece_type' do
      let(:piece_rule_params) { {piece_type: nil} }
      specify { expect(piece_rule).to be_invalid }
    end

    context 'piece_type == king' do
      let(:piece_rule) { build(:piece_rule, piece_rule_params.merge(piece_type: create(:piece_type, name: 'King'))) }

      context 'count != 1' do
        let(:piece_rule_params) { {count: 2} }
        specify { expect(piece_rule).to be_invalid }
      end
    end

    context 'no capture_type' do
      let(:piece_rule_params) { {capture_type: nil} }
      specify { expect(piece_rule).to be_invalid }
    end

    context 'capture_type == movement' do
      let(:piece_rule_params) { {capture_type: 'movement'} }
      specify { expect(piece_rule).to be_valid }
    end

    context 'capture_type == range' do
      before { piece_rule_params.merge!(capture_type: 'range') }

      context 'no range_type' do
        let(:piece_rule_params) { {range_type: nil} }
        specify { expect(piece_rule).to be_invalid }
      end

      context 'no range_minimum' do
        let(:piece_rule_params) { {range_minimum: nil} }
        specify { expect(piece_rule).to be_invalid }
      end

      context 'range_maximum < 1' do
        let(:piece_rule_params) { {range_minimum: 0} }
        specify { expect(piece_rule).to be_invalid }
      end

      context 'no range_maximum' do
        let(:piece_rule_params) { {range_maximum: nil} }
        specify { expect(piece_rule).to be_valid }
      end

      context 'range_maximum < range_minimum' do
        let(:piece_rule_params) { {range_minimum: 2, range_maximum: 1} }
        specify { expect(piece_rule).to be_invalid }
      end
    end

    context 'no variant' do
      let(:piece_rule_params) { {variant: nil} }
      specify { expect(piece_rule).to be_invalid }
    end
  end

  context '#movement_description' do
    let(:piece_rule) { build(:piece_rule, piece_rule_params.merge(movement_type: 'orthogonal_line')) }

    context 'no movement_maximum' do
      let(:piece_rule_params) { { movement_minimum: 1, movement_maximum: nil } }
      specify { expect(piece_rule.movement_description).to eql "movement: orthogonal line - 1 or more space(s)" }
    end

    context 'movement_minimum == movement_maximum' do
      let(:piece_rule_params) { { movement_minimum: 2, movement_maximum: 2 } }
      specify { expect(piece_rule.movement_description).to eql "movement: orthogonal line - 2 space(s)" }
    end

    context 'movement_minimum < movement_maximum' do
      let(:piece_rule_params) { { movement_minimum: 1, movement_maximum: 2 } }
      specify { expect(piece_rule.movement_description).to eql "movement: orthogonal line - 1 to 2 space(s)" }
    end
  end

  context '#capture_description' do
    let(:piece_rule) { build(:piece_rule, piece_rule_params) }

    context 'capture_type == movement' do
      let(:piece_rule_params) { {capture_type: 'movement'} }
      specify { expect(piece_rule.capture_description).to eql "capture by movement" }
    end

    context 'capture_type == range' do
      before { piece_rule_params.merge!(capture_type: 'range', range_type: 'orthogonal_line') }

      context 'no range_maximum' do
        let(:piece_rule_params) { { range_minimum: 1, range_maximum: nil } }
        specify { expect(piece_rule.capture_description).to eql "capture by range: orthogonal line - 1 or more space(s)" }
      end

      context 'range_minimum == range_maximum' do
        let(:piece_rule_params) { { range_minimum: 2, range_maximum: 2 } }
        specify { expect(piece_rule.capture_description).to eql "capture by range: orthogonal line - 2 space(s)" }
      end

      context 'range_minimum < range_maximum' do
        let(:piece_rule_params) { { range_minimum: 1, range_maximum: 2 } }
        specify { expect(piece_rule.capture_description).to eql "capture by range: orthogonal line - 1 to 2 space(s)" }
      end
    end
  end

  context '#range_capture_restriction' do
    let(:piece_rule) { build(:piece_rule, move_and_range_capture: move_and_range_capture) }

    context 'move_and_range_capture == true' do
      let(:move_and_range_capture) { true }
      specify { expect(piece_rule.range_capture_restriction).to eql 'can move and capture on the same turn' }
    end

    context 'move_and_range_capture == false' do
      let(:move_and_range_capture) { false }
      specify { expect(piece_rule.range_capture_restriction).to eql 'cannot move and capture on the same turn' }
    end
  end
end
