require 'spec_helper'

describe Challenge do
  context 'validating' do
    let(:challenge) { build(:challenge, challenge_params) }
    let(:challenge_params) { {} }

    context 'with the default factory' do
      specify { challenge.should be_valid }
    end

    context 'no challenger' do
      let(:challenge_params) { {challenger: nil} }
      specify { challenge.should be_invalid }
    end
  end
end
