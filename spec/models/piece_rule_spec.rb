require 'spec_helper'

describe PieceRule do
  context 'validating' do
    let(:piece_rule) { build(:piece_rule, piece_rule_params) }
    let(:piece_rule_params) { {} }

    context 'with the default factory' do
      specify { piece_rule.should be_valid }
    end

    context 'no count_minimum' do
      let(:piece_rule_params) { {count_minimum: nil} }
      specify { piece_rule.should be_invalid }
    end

    context 'count_minimum < 0' do
      let(:piece_rule_params) { {count_minimum: -1} }
      specify { piece_rule.should be_invalid }
    end

    context 'no count_maximum' do
      let(:piece_rule_params) { {count_maximum: nil} }
      specify { piece_rule.should be_valid }
    end

    context 'count_maximum < count_minimum' do
      let(:piece_rule_params) { {count_minimum: 2, count_maximum: 1} }
      specify { piece_rule.should be_invalid }
    end

    context 'no movement_type' do
      let(:piece_rule_params) { {movement_type: nil} }
      specify { piece_rule.should be_invalid }
    end

    context 'no movement_minimum' do
      let(:piece_rule_params) { {movement_minimum: nil} }
      specify { piece_rule.should be_invalid }
    end

    context 'movement_maximum < 1' do
      let(:piece_rule_params) { {movement_minimum: 0} }
      specify { piece_rule.should be_invalid }
    end

    context 'no movement_maximum' do
      let(:piece_rule_params) { {movement_maximum: nil} }
      specify { piece_rule.should be_valid }
    end

    context 'movement_maximum < movement_minimum' do
      let(:piece_rule_params) { {movement_minimum: 2, movement_maximum: 1} }
      specify { piece_rule.should be_invalid }
    end

    context 'no piece_type' do
      let(:piece_rule_params) { {piece_type: nil} }
      specify { piece_rule.should be_invalid }
    end

    context 'piece_type == king' do
      let(:piece_rule) { build(:piece_rule, piece_rule_params.merge(piece_type: create(:piece_type, name: 'King'))) }

      context 'count_minimum != 1' do
        let(:piece_rule_params) { {count_minimum: 0, count_maximum: 1} }
        specify { piece_rule.should be_invalid }
      end

      context 'count_maximum != 1' do
        let(:piece_rule_params) { {count_minimum: 1, count_maximum: 2} }
        specify { piece_rule.should be_invalid }
      end
    end

    context 'no capture_type' do
      let(:piece_rule_params) { {capture_type: nil} }
      specify { piece_rule.should be_invalid }
    end

    context 'capture_type == movement' do
      let(:piece_rule_params) { {capture_type: 'movement'} }
      specify { piece_rule.should be_valid }
    end

    context 'capture_type == range' do
      before { piece_rule_params.merge!(capture_type: 'range') }

      context 'no range_type' do
        let(:piece_rule_params) { {range_type: nil} }
        specify { piece_rule.should be_invalid }
      end

      context 'no range_minimum' do
        let(:piece_rule_params) { {range_minimum: nil} }
        specify { piece_rule.should be_invalid }
      end

      context 'range_maximum < 1' do
        let(:piece_rule_params) { {range_minimum: 0} }
        specify { piece_rule.should be_invalid }
      end

      context 'no range_maximum' do
        let(:piece_rule_params) { {range_maximum: nil} }
        specify { piece_rule.should be_valid }
      end

      context 'range_maximum < range_minimum' do
        let(:piece_rule_params) { {range_minimum: 2, range_maximum: 1} }
        specify { piece_rule.should be_invalid }
      end
    end

    context 'no variant' do
      let(:piece_rule_params) { {variant: nil} }
      specify { piece_rule.should be_invalid }
    end
  end

  context '#count_description' do
    let(:piece_rule) { build(:piece_rule, piece_rule_params) }

    context 'no count_maximum' do
      let(:piece_rule) { build(:piece_rule, count_minimum: 1, count_maximum: nil ) }
      specify { piece_rule.count_description.should == "1 or more" }
    end

    context 'count_minimum == count_maximum' do
      let(:piece_rule) { build(:piece_rule, count_minimum: 2, count_maximum: 2 ) }
      specify { piece_rule.count_description.should == "2" }
    end

    context 'count_minimum < count_maximum' do
      let(:piece_rule) { build(:piece_rule, count_minimum: 0, count_maximum: 1 ) }
      specify { piece_rule.count_description.should == "0 to 1" }
    end
  end

  context '#movement_description' do
    let(:piece_rule) { build(:piece_rule, piece_rule_params.merge(movement_type: 'orthogonal_line')) }

    context 'no movement_maximum' do
      let(:piece_rule_params) { { movement_minimum: 1, movement_maximum: nil } }
      specify { piece_rule.movement_description.should == "Orthogonal line - 1 or more space(s)" }
    end

    context 'movement_minimum == movement_maximum' do
      let(:piece_rule_params) { { movement_minimum: 2, movement_maximum: 2 } }
      specify { piece_rule.movement_description.should == "Orthogonal line - 2 space(s)" }
    end

    context 'movement_minimum < movement_maximum' do
      let(:piece_rule_params) { { movement_minimum: 1, movement_maximum: 2 } }
      specify { piece_rule.movement_description.should == "Orthogonal line - 1 to 2 space(s)" }
    end
  end

  context '#capture_description' do
    let(:piece_rule) { build(:piece_rule, piece_rule_params) }

    context 'capture_type == movement' do
      let(:piece_rule_params) { {capture_type: 'movement'} }
      specify { piece_rule.capture_description.should == "By movement" }
    end

    context 'capture_type == range' do
      before { piece_rule_params.merge!(capture_type: 'range', range_type: 'orthogonal_line') }

      context 'no range_maximum' do
        let(:piece_rule_params) { { range_minimum: 1, range_maximum: nil } }
        specify { piece_rule.capture_description.should == "By range: Orthogonal line - 1 or more space(s)" }
      end

      context 'range_minimum == range_maximum' do
        let(:piece_rule_params) { { range_minimum: 2, range_maximum: 2 } }
        specify { piece_rule.capture_description.should == "By range: Orthogonal line - 2 space(s)" }
      end

      context 'range_minimum < range_maximum' do
        let(:piece_rule_params) { { range_minimum: 1, range_maximum: 2 } }
        specify { piece_rule.capture_description.should == "By range: Orthogonal line - 1 to 2 space(s)" }
      end
    end
  end
end
