module JsonRequestHelpers
  RSpec::Matchers.define :be_json do |expected|
    match do |actual|
      @expected = expected.as_json
      @actual = JSON.parse(actual)
      @expected == @actual
    end

    description { "be JSON: #{@expected}" }

    failure_message_for_should do
      "\nexpected: #{@expected}\n     got: #{@actual}\n"
    end

    diffable
  end
end

RSpec.configure do |config|
  config.include JsonRequestHelpers, :type => :controller
end
