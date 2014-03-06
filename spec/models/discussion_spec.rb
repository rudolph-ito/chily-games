require 'spec_helper'

describe Discussion do
  context 'validating' do
    let(:discussion) { build(:discussion, discussion_params) }
    let(:discussion_params) { {} }

    context 'with the default factory' do
      specify { expect(discussion).to be_valid }
    end

    context 'no description' do
      let(:discussion_params) { {description: nil} }
      specify { expect(discussion).to be_invalid }
    end

    context 'no title' do
      let(:discussion_params) { {title: nil} }
      specify { expect(discussion).to be_invalid }
    end

    context 'duplicate title' do
      let(:discussion_params) { {title: 'A discussion'} }
      before { create(:discussion, discussion_params) }
      specify { expect(discussion).to be_invalid }
    end
  end
end
