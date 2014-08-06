require 'spec_helper'

describe PieceRuleDecorator do
  let(:decorator) { PieceRuleDecorator.new(piece_rule) }
  let(:piece_rule) { double :piece_rule, piece_rule_parameters }

  context '#capture_description' do
    context 'not range capture' do
      let(:piece_rule_parameters) { { range_capture?: false } }
      specify { expect(decorator.capture_description).to eql "capture by movement" }
    end

    context 'range capture' do
      let(:piece_rule_parameters) { { range_capture?: true, range_type: 'orthogonal_line' }.merge(range_parameters) }

      context 'no range_maximum' do
        let(:range_parameters) { { range_minimum: 1, range_maximum: nil } }
        specify { expect(decorator.capture_description).to eql "capture by range: orthogonal line - 1 or more space(s)" }
      end

      context 'range_minimum == range_maximum' do
        let(:range_parameters) { { range_minimum: 2, range_maximum: 2 } }
        specify { expect(decorator.capture_description).to eql "capture by range: orthogonal line - 2 space(s)" }
      end

      context 'range_minimum < range_maximum' do
        let(:range_parameters) { { range_minimum: 1, range_maximum: 2 } }
        specify { expect(decorator.capture_description).to eql "capture by range: orthogonal line - 1 to 2 space(s)" }
      end
    end
  end

  context '#movement_description' do
    let(:piece_rule_parameters) { { movement_type: 'orthogonal_line' }.merge(movement_parameters) }

    context 'no movement_maximum' do
      let(:movement_parameters) { { movement_minimum: 1, movement_maximum: nil } }
      specify { expect(decorator.movement_description).to eql "movement: orthogonal line - 1 or more space(s)" }
    end

    context 'movement_minimum == movement_maximum' do
      let(:movement_parameters) { { movement_minimum: 2, movement_maximum: 2 } }
      specify { expect(decorator.movement_description).to eql "movement: orthogonal line - 2 space(s)" }
    end

    context 'movement_minimum < movement_maximum' do
      let(:movement_parameters) { { movement_minimum: 1, movement_maximum: 2 } }
      specify { expect(decorator.movement_description).to eql "movement: orthogonal line - 1 to 2 space(s)" }
    end
  end

  context '#range_capture_restriction' do
    let(:piece_rule_parameters) { { move_and_range_capture?: move_and_range_capture } }

    context 'move_and_range_capture == true' do
      let(:move_and_range_capture) { true }
      specify { expect(decorator.range_capture_restriction).to eql 'can move and capture on the same turn' }
    end

    context 'move_and_range_capture == false' do
      let(:move_and_range_capture) { false }
      specify { expect(decorator.range_capture_restriction).to eql 'cannot move and capture on the same turn' }
    end
  end
end
