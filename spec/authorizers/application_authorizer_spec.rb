require 'spec_helper'

describe ApplicationAuthorizer do
  let(:user) { build(:user) }

  describe ".default" do
    specify { expect(ApplicationAuthorizer.default('create', user)).to be_false }
  end

  describe ".readable_by" do
    specify { expect(ApplicationAuthorizer.readable_by?(user)).to be_true }
  end

  describe "#readable_by" do
    specify { expect(ApplicationAuthorizer.new(user).readable_by?(user)).to be_true }
  end

  describe "#managable_by" do
    specify { expect(ApplicationAuthorizer.new(user).managable_by?(user)).to be_false }
  end
end
