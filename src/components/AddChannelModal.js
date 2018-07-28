import React from 'react';
import { Form, Button, Header, Input, Modal } from 'semantic-ui-react';
import { withFormik } from 'formik';
import { graphql, compose } from "react-apollo";
import gql from "graphql-tag";

import findIndex from 'lodash/findIndex';

import { meQuery } from '../graphql/team';

const AddChannelModal = ({
    open,
    onClose,
    values,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitting,
}) => (
        <Modal open={open} onClose={onClose} size='tiny'>
            <Header>Create a New Channel</Header>
            <Modal.Content>
                <Form>
                    <Form.Field>
                        <Input
                            value={values.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            name="name"
                            fluid
                            placeholder='Channel Name...'
                        />
                    </Form.Field>

                    <Form.Group widths="equal">
                        <Button color='blue' disabled={isSubmitting} onClick={handleSubmit} compact fluid type="submit">Create Channel</Button>
                        <Button color='red' disabled={isSubmitting} onClick={onClose} compact fluid>Cancel</Button>
                    </Form.Group>

                </Form>
            </Modal.Content>

        </Modal>
    )

const createChannelMutation = gql`
    mutation($teamId: Int!, $name: String!) {
      createChannel(teamId: $teamId, name: $name) {
        ok
        channel {
          id
          name
        }
      }
    }
  `;

export default compose(
    graphql(createChannelMutation),
    withFormik({
        mapPropsToValues: () => ({ name: '' }),
        handleSubmit: async (values, { props: { onClose, teamId, mutate }, setSubmitting }) => {
            await mutate({
                variables: { teamId, name: values.name },
                optimisticResponse: {
                    createChannel: {
                        __typename: 'Mutation',
                        ok: true,
                        channel: {
                            __typename: 'Channel',
                            id: -1,
                            name: values.name,
                        },
                    },
                },
                update: (store, { data: { createChannel } }) => {
                    const { ok, channel } = createChannel;
                    if (!ok) {
                        return;
                    }

                    const data = store.readQuery({ query: meQuery });
                    const teamIdx = findIndex(data.me.teams, ['id', teamId]);
                    data.me.teams[teamIdx].channels.push(channel);
                    store.writeQuery({ query: meQuery, data });
                },
            });
            onClose();
            setSubmitting(false);
        },
    }),
)(AddChannelModal);